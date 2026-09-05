// ============================================================
// QUET QR TO LENH - GOOGLE APPS SCRIPT WEB APP
// Version: V36
//
// Tra cuu Ma Lenh chi 1 lan.
// Neu khong co ket qua hoac co loi thi tra ve null.
// index.html se tu xu ly mo Form nhu binh thuong.
// ============================================================

const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxE1sH5LNxnqYPevbp9ow3e-a9wETeUlIpoLD0mIxANgD7olMOjEcKQU-QRz87n3zladQ/exec";


// ============================================================
// Tra cuu Ma Lenh - chi goi Web App 1 lan
//
// Ket qua tra ve:
// Khach Hang|Don Hang|Ma Lenh|Kich Don|So Luong
//
// Neu khong tim thay hoac loi:
// null
// ============================================================

async function traCuuMaLenh(maLenh) {

    maLenh = String(maLenh || "")
        .replace(/&scale=10/g, "")
        .trim();


    if (!maLenh) {
        return null;
    }


    try {

        const url =
            APPS_SCRIPT_URL +
            "?maLenh=" +
            encodeURIComponent(maLenh);


        // Chi fetch dung 1 lan.
        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });


        if (!response.ok) {
            console.log(
                "Apps Script HTTP:",
                response.status
            );

            return null;
        }


        const result = await response.json();


        // Web App bao loi hoac khong co du lieu.
        if (!result || result.ok !== true || !result.data) {
            console.log(
                "Tra cuu Ma Lenh khong co ket qua:",
                result && result.error ? result.error : result
            );

            return null;
        }


        const data = result.data;


        // Chuyen ket qua JSON cua Apps Script ve dung chuoi
        // ma index.html dang su dung.
        const khachHang = String(data.khachHang || "").trim();
        const donHang = String(data.donHang || "").trim();
        const maLenhKetQua = String(data.maLenh || maLenh).trim();


        // Chi chuan hoa dau thap phan trong Kich Don.
        // Khong thay the dau cham cua Don Hang hoac Ma Lenh.
        const kichDon = String(data.kichDon || "")
            .trim()
            .replace(/\./g, ",");


        const soLuong = String(data.soLuong || "").trim();


        return [
            khachHang,
            donHang,
            maLenhKetQua,
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
