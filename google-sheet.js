let cauHinhGoogleSheet = null;


// ============================================================
// Đọc file config.json
// ============================================================

async function taiCauHinhGoogleSheet() {

    if (cauHinhGoogleSheet !== null) {
        return cauHinhGoogleSheet;
    }

    const configUrl = new URL("./config.json", document.baseURI).href;
    const response = await fetch(configUrl, {
        cache: "no-store",
        credentials: "same-origin"
    });

    if (!response.ok) {
        throw new Error("Không thể đọc file config.json.");
    }

    cauHinhGoogleSheet = await response.json();

    return cauHinhGoogleSheet;
}


// ============================================================
// Tra cứu Mã Lệnh
//
// Chỉ cần truyền:
//     Mã Lệnh
//
// Ví dụ:
//     await traCuuMaLenh("T09.26.64.1")
//
// Hàm sẽ tự:
//     1. Lấy T09.26 từ Mã Lệnh
//     2. Tìm T09.26 trong config.json
//     3. Lấy Link Google Sheet
//     4. Lấy Tên Sheet
//     5. Tra cứu dữ liệu
// ============================================================

async function traCuuMaLenh(maLenh) {

    maLenh = String(maLenh).trim();

    if (!maLenh) {
        throw new Error("Mã Lệnh đang trống.");
    }


    // --------------------------------------------------------
    // Lấy mã tháng từ Mã Lệnh
    //
    // Ví dụ:
    // T09.26.64.1
    //
    // sẽ lấy:
    // T09.26
    // --------------------------------------------------------

    const phanMa = maLenh.split(".");

    if (phanMa.length < 2) {
        throw new Error("Mã Lệnh không đúng định dạng.");
    }

    const maThang = phanMa[0] + "." + phanMa[1];


    // --------------------------------------------------------
    // Đọc config.json
    // --------------------------------------------------------

    const config = await taiCauHinhGoogleSheet();

    const thongTinSheet = config[maThang];

    if (!thongTinSheet) {

        throw new Error(
            "Chưa có cấu hình Google Sheet cho " + maThang
        );

    }


    const linkGoogleSheet = thongTinSheet.link;
    const tenSheet = thongTinSheet.tenSheet;


    if (!linkGoogleSheet) {
        throw new Error(
            "Chưa có Link Google Sheet cho " + maThang
        );
    }


    if (!tenSheet) {
        throw new Error(
            "Chưa có Tên Sheet cho " + maThang
        );
    }


    // --------------------------------------------------------
    // Lấy ID Google Sheet từ Link
    // --------------------------------------------------------

    const match = linkGoogleSheet.match(
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
    );

    if (!match) {
        throw new Error(
            "Link Google Sheet không hợp lệ."
        );
    }

    const sheetId = match[1];


    // --------------------------------------------------------
    // Truy vấn Google Sheet
    //
    // B  = Mã Lệnh
    // F  = GONGHIATIN
    // G  = Giá trị thứ 2
    // K  = Kích thước 1
    // L  = Kích thước 2
    // M  = Kích thước 3
    // N  = Số lượng 1
    // O  = Số lượng 2
    // --------------------------------------------------------

    const query =
        "select B,F,G,K,L,M,N,O where B = '" +
        maLenh.replace(/'/g, "''") +
        "'";


    const url =
        "https://docs.google.com/spreadsheets/d/" +
        sheetId +
        "/gviz/tq?sheet=" +
        encodeURIComponent(tenSheet) +
        "&tq=" +
        encodeURIComponent(query);


    // --------------------------------------------------------
    // Google Sheets JSONP
    // --------------------------------------------------------

    return new Promise((resolve, reject) => {

        const callbackName =
            "googleSheetCallback_" +
            Date.now() +
            "_" +
            Math.floor(Math.random() * 100000);


        const script = document.createElement("script");


        const timeout = setTimeout(() => {

            cleanup();

            reject(
                new Error(
                    "Google Sheet không phản hồi."
                )
            );

        }, 15000);


        function cleanup() {

            clearTimeout(timeout);

            try {

                delete window[callbackName];

            } catch (e) {

                window[callbackName] = undefined;

            }


            if (script.parentNode) {

                script.parentNode.removeChild(script);

            }

        }


        window[callbackName] = function(data) {

            cleanup();


            try {

                if (
                    !data ||
                    !data.table ||
                    !data.table.rows ||
                    data.table.rows.length === 0
                ) {

                    reject(
                        new Error(
                            "Không tìm thấy Mã Lệnh: " +
                            maLenh
                        )
                    );

                    return;
                }


                const cells =
                    data.table.rows[0].c || [];


                function getValue(index) {

                    if (
                        cells[index] &&
                        cells[index].v !== null &&
                        cells[index].v !== undefined
                    ) {

                        return String(
                            cells[index].v
                        );

                    }

                    return "";

                }


                // ------------------------------------------------
                // Lấy dữ liệu
                // ------------------------------------------------

                const gonghiatin =
                    getValue(1);


                const giaTri2 =
                    getValue(2);


                // ------------------------------------------------
                // Kích thước
                //
                // K x L
                //
                // Nếu M có dữ liệu:
                // K x L x M
                // ------------------------------------------------

                const kichDai =
                    getValue(3);


                const kichRong =
                    getValue(4);


                const kichCao =
                    getValue(5);


                let kichThuoc =
                    kichDai +
                    "x" +
                    kichRong;


                if (kichCao !== "") {

                    kichThuoc +=
                        "x" +
                        kichCao;

                }


                // ------------------------------------------------
                // Số lượng
                //
                // N + O
                // ------------------------------------------------

                const soLuong1 =
                    parseFloat(
                        getValue(6)
                    ) || 0;


                const soLuong2 =
                    parseFloat(
                        getValue(7)
                    ) || 0;


                const tongSoLuong =
                    soLuong1 +
                    soLuong2;


                // ------------------------------------------------
                // Kết quả cuối cùng
                // ------------------------------------------------

                const ketQua =
                    gonghiatin +
                    "|" +
                    giaTri2 +
                    "|" +
                    maLenh +
                    "|" +
                    kichThuoc +
                    "|" +
                    tongSoLuong;


                resolve(ketQua);

            } catch (error) {

                reject(error);

            }

        };


        script.onerror = function() {

            cleanup();

            reject(
                new Error(
                    "Không thể đọc dữ liệu Google Sheet."
                )
            );

        };


        script.src =
            url +
            "&tqx=responseHandler:" +
            callbackName;


        document.body.appendChild(script);

    });

}