package com.neudebateclub.backend.finance;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PayosClientTest {

    // Mẫu chính thức: https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature
    private static final String DOCS_CHECKSUM_KEY = "1a54716c8f0efb2744fb28b6e38b25da7f67a925d98bc1c18bd8faaecadd7675";
    private static final String DOCS_SIGNATURE = "412e915d2871504ed31be63c8f62a149a4410d34c4c42affc9006ef9917eaa03";

    static String docsWebhook(String signature) {
        return """
                {"code":"00","desc":"success","success":true,"data":{"orderCode":123,"amount":3000,
                "description":"VQRIO123","accountNumber":"12345678","reference":"TF230204212323",
                "transactionDateTime":"2023-02-04 18:25:00","currency":"VND",
                "paymentLinkId":"124c33293c43417ab7879e14c8d9eb18","code":"00","desc":"Thành công",
                "counterAccountBankId":"","counterAccountBankName":"","counterAccountName":"",
                "counterAccountNumber":"","virtualAccountName":"","virtualAccountNumber":""},
                "signature":"%s"}""".formatted(signature);
    }

    static PayosClient docsClient() {
        return new PayosClient(JsonMapper.builder().build(), "client", "api", DOCS_CHECKSUM_KEY);
    }

    @Test
    void verifiesOfficialDocsWebhookSample() {
        var data = docsClient().verifiedWebhookData(docsWebhook(DOCS_SIGNATURE));

        assertNotNull(data);
        assertEquals(123, data.path("orderCode").asLong());
    }

    @Test
    void rejectsTamperedOrMalformedWebhook() {
        PayosClient client = docsClient();
        assertNull(client.verifiedWebhookData(docsWebhook(DOCS_SIGNATURE).replace("\"amount\":3000", "\"amount\":3")));
        assertNull(client.verifiedWebhookData(docsWebhook("deadbeef")));
        assertNull(client.verifiedWebhookData("not json"));
        // Chưa cấu hình PayOS thì không tin webhook nào.
        assertNull(new PayosClient(JsonMapper.builder().build(), "", "", "").verifiedWebhookData(docsWebhook(DOCS_SIGNATURE)));
    }
}
