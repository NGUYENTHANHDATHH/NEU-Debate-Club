package com.neudebateclub.backend.cms;

import com.neudebateclub.backend.common.exception.ValidationException;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

/**
 * Lưu ảnh CMS vào MinIO (bucket {@value #BUCKET}, ai cũng đọc được). Caddy chuyển /media/* sang MinIO,
 * nên URL trả về là đường dẫn tương đối /media/&lt;key&gt;. Không cấu hình khoá MinIO thì upload tắt.
 */
@Slf4j
@Service
public class ImageStorageService {

    /** Trùng với path công khai /media/* trong Caddyfile và next.config.ts. */
    static final String BUCKET = "media";
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/gif", "gif");
    private static final String PUBLIC_READ_POLICY = """
            {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},\
            "Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}""".formatted(BUCKET);

    private final MinioClient client;

    public ImageStorageService(
            @Value("${app.storage.url}") String url,
            @Value("${app.storage.access-key}") String accessKey,
            @Value("${app.storage.secret-key}") String secretKey) {
        this.client = accessKey.isBlank() ? null
                : MinioClient.builder().endpoint(url.trim()).credentials(accessKey.trim(), secretKey.trim()).build();
    }

    @PostConstruct
    void ensureBucket() {
        if (client == null) {
            log.info("MinIO chưa cấu hình (MINIO_ACCESS_KEY trống): tắt upload ảnh");
            return;
        }
        // Không làm sập app khi MinIO chưa chạy (dev, CI); upload sẽ báo lỗi cho tới khi MinIO lên.
        try {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(BUCKET).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(BUCKET).build());
            }
            client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(BUCKET).config(PUBLIC_READ_POLICY).build());
            log.info("MinIO sẵn sàng, bucket '{}'", BUCKET);
        } catch (Exception e) {
            log.warn("Không kết nối được MinIO: {}", e.getMessage());
        }
    }

    /** Lưu ảnh với tên {@code id.<đuôi>} và trả về URL công khai. */
    public String upload(MultipartFile file, UUID id) {
        String key = id + "." + extension(file.getContentType());
        if (client == null) throw new ValidationException("Server chưa cấu hình nơi lưu ảnh (MinIO).");
        try (InputStream in = file.getInputStream()) {
            client.putObject(PutObjectArgs.builder().bucket(BUCKET).object(key)
                    .stream(in, file.getSize(), -1).contentType(file.getContentType()).build());
        } catch (Exception e) {
            throw new IllegalStateException("Không lưu được ảnh vào MinIO", e);
        }
        return "/" + BUCKET + "/" + key;
    }

    /** Chỉ nhận ảnh raster; SVG bị loại vì có thể chứa script. */
    static String extension(String contentType) {
        String ext = contentType == null ? null : EXTENSIONS.get(contentType.toLowerCase());
        if (ext == null) throw new ValidationException("Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.");
        return ext;
    }
}
