// ============================================================
// QUET QR TO LENH - GOOGLE VISUALIZATION API
// Version: V37
//
// Tra cuu truc tiep Google Sheet Public.
// Khong dung Google Apps Script Web App.
// Chi tim 1 lan cho moi Ma Lenh.
// Neu khong co ket qua hoac co loi thi tra ve null.
// index.html se tu xu ly mo Form nhu binh thuong.
// ============================================================

const CONFIG_URL =
    "https://raw.githubusercontent.com/BinhPo21/scanToWeb/refs/heads/main/config.json";


// Luu config trong luc trang dang mo de khong phai tai lai
// o moi lan quet. Neu sang thang moi ma chua co trong cache,
// code se tai lai config 1 lan.
let configCache = null;


// ============================================================
// Bo &scale=10 khoi Ma Lenh
// ============================================================
function boScale10GoogleSheet(value) {

    return String(value || "")
        .replace(/&scale=10/g, "")
        .trim();
}


// ============================================================
// Lay Ma Thang tu Ma Lenh
// Vi du: T09.26.85.1 => T09.26
// ============================================================
function layMaThang(maLenh) {

    const parts = String(maLenh || "")
        .trim()
        .split(".");

    if (parts.length < 2) {
        return "";
    }

    return parts[0] + "." + parts[1];
}


// ============================================================
// Lay Spreadsheet ID tu link Google Sheet
// ============================================================
function laySpreadsheetId(link) {

    const match = String(link || "")
        .match(/\/spreadsheets\/d\/([^\/?#]+)/i);

    return match ? match[1] : "";
}


// ============================================================
// Tai config.json
// forceReload = true dung khi can tai lai config moi
// ============================================================
async function taiConfig(forceReload = false) {

    if (configCache && !forceReload) {
        return configCache;
    }

    const response = await fetch(
        CONFIG_URL + "?_=" + Date.now(),
        {
            method: "GET",
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            "Khong tai duoc config.json. HTTP: " +
            response.status
        );
    }

    const config = await response.json();

    if (!config || typeof config !== "object") {
        throw new Error("config.json khong hop le.");
    }

    configCache = config;

    return config;
}


// ============================================================
// Lay thong tin Sheet theo Ma Thang
// Neu khong co trong cache thi tai lai config 1 lan.
// ============================================================
async function layThongTinSheet(maThang) {

    let config = await taiConfig(false);

    let thongTin = config[maThang];

    if (!thongTin) {

        config = await taiConfig(true);

        thongTin = config[maThang];
    }

    if (!thongTin) {
        throw new Error(
            "Khong tim thay cau hinh cho: " + maThang
        );
    }

    const spreadsheetId = laySpreadsheetId(thongTin.link);

    if (!spreadsheetId) {
        throw new Error(
            "Khong lay duoc Spreadsheet ID cua: " + maThang
        );
    }

    const tenSheet = String(
        thongTin.tenSheet || ""
    ).trim();

    if (!tenSheet) {
        throw new Error(
            "Khong co ten Sheet cua: " + maThang
        );
    }

    return {
        spreadsheetId: spreadsheetId,
        tenSheet: tenSheet
    };
}


// ============================================================
// Chuyen phan hoi Google Visualization API thanh JSON
// Phan hoi thuong co dang:
// google.visualization.Query.setResponse({...});
// ============================================================
function tachJsonVisualization(text) {

    const value = String(text || "").trim();

    const start = value.indexOf("(");
    const end = value.lastIndexOf(")");

    if (start < 0 || end <= start) {
        throw new Error(
            "Phan hoi Google Visualization khong hop le."
        );
    }

    const jsonText = value
        .substring(start + 1, end)
        .trim();

    return JSON.parse(jsonText);
}


// ============================================================
// Lay gia tri hien thi cua 1 o
// Uu tien .f de giu dung dinh dang Google Sheet.
// ============================================================
function layGiaTriO(cell) {

    if (!cell) {
        return "";
    }

    if (
        cell.f !== undefined &&
        cell.f !== null
    ) {
        return String(cell.f).trim();
    }

    if (
        cell.v !== undefined &&
        cell.v !== null
    ) {
        return String(cell.v).trim();
    }

    return "";
}


// ============================================================
// Tra cuu Ma Lenh bang Google Visualization API
//
// Query dung 1 lan:
// select B,F,G,K,L,M,N where B = 'Ma Lenh'
//
// Ket qua:
// Khach Hang|Don Hang|Ma Lenh|Kich Don|So Luong
//
// Neu khong tim thay hoac co loi:
// null
// ============================================================
async function traCuuMaLenh(maLenh) {

    maLenh = boScale10GoogleSheet(maLenh);

    if (!maLenh) {
        return null;
    }


    try {

        const maThang = layMaThang(maLenh);

        if (!maThang) {
            console.log("Ma Lenh khong hop le:", maLenh);
            return null;
        }


        const thongTin = await layThongTinSheet(maThang);


        const query =
            "select B,F,G,K,L,M,N where B = '" +
            maLenh.replace(/'/g, "''") +
            "'";


        const params = new URLSearchParams({
            sheet: thongTin.tenSheet,
            tq: query
        });


        // Goi truc tiep Google Sheet Public.
        // Them timestamp de tranh trinh duyet dung cache cu.
        const url =
            "https://docs.google.com/spreadsheets/d/" +
            thongTin.spreadsheetId +
            "/gviz/tq?" +
            params.toString() +
            "&_=" + Date.now();


        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });


        if (!response.ok) {

            console.log(
                "Google Visualization HTTP:",
                response.status
            );

            return null;
        }


        const text = await response.text();

        const result = tachJsonVisualization(text);


        if (
            !result ||
            result.status !== "ok" ||
            !result.table ||
            !Array.isArray(result.table.rows) ||
            result.table.rows.length === 0
        ) {

            console.log(
                "Khong tim thay Ma Lenh:",
                maLenh
            );

            return null;
        }


        const row = result.table.rows[0];
        const cells = row && Array.isArray(row.c)
            ? row.c
            : [];


        // Thu tu query:
        // B = Ma Lenh
        // F = Khach Hang
        // G = Don Hang
        // K = Kich 1
        // L = Kich 2
        // M = Kich 3
        // N = So Luong
        const maLenhSheet = layGiaTriO(cells[0]);
        const khachHang = layGiaTriO(cells[1]);
        const donHang = layGiaTriO(cells[2]);

        const kich1 = layGiaTriO(cells[3]);
        const kich2 = layGiaTriO(cells[4]);
        const kich3 = layGiaTriO(cells[5]);


        // Chi doi dau cham thanh dau phay trong Kich Don.
        // Khong anh huong Don Hang hoac Ma Lenh.
        const kichDon = [
            kich1,
            kich2,
            kich3
        ]
            .filter(Boolean)
            .join("x")
            .replace(/\./g, ",");


        const soLuong = layGiaTriO(cells[6]);


        return [
            khachHang,
            donHang,
            maLenhSheet || maLenh,
            kichDon,
            soLuong
        ].join("|");


    } catch (error) {

        console.log(
            "Tra cuu Ma Lenh that bai:",
            error && error.message ? error.message : error
        );

        return null;
    }
}
