package com.paiagent.service;

import com.paiagent.config.MinioConfig;
import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * MinIO 存储服务
 */
@Slf4j
@Service
public class MinioService {

    private final MinioConfig minioConfig;
    private MinioClient minioClient;

    public MinioService(MinioConfig minioConfig) {
        this.minioConfig = minioConfig;
    }

    @PostConstruct
    public void init() {
        try {
            minioClient = MinioClient.builder()
                    .endpoint(minioConfig.getEndpoint())
                    .credentials(minioConfig.getAccessKey(), minioConfig.getSecretKey())
                    .build();

            // 检查并创建存储桶
            String bucketName = minioConfig.getBucketName();
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!bucketExists) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                log.info("创建 MinIO 存储桶: {}", bucketName);
            }

            // 设置存储桶策略为公开读取
            String policy = String.format("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": ["arn:aws:s3:::%s/*"]
                        }
                    ]
                }
                """, bucketName);

            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(bucketName)
                    .config(policy)
                    .build());

            log.info("MinIO 初始化成功, endpoint: {}, bucket: {}", minioConfig.getEndpoint(), bucketName);

        } catch (Exception e) {
            log.error("MinIO 初始化失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 上传音频文件
     *
     * @param inputStream 文件输入流
     * @param contentType 文件类型
     * @param extension   文件扩展名
     * @return 文件访问 URL
     */
    public String uploadAudio(InputStream inputStream, String contentType, String extension) {
        try {
            String objectName = "audio/" + UUID.randomUUID().toString() + extension;
            String bucketName = minioConfig.getBucketName();

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, -1, 50 * 1024 * 1024) // 最大 50MB
                    .contentType(contentType)
                    .build());

            // 构建公开访问 URL
            String publicUrl = minioConfig.getPublicUrl();
            String fileUrl = publicUrl + "/" + bucketName + "/" + objectName;

            log.info("文件上传成功: {}", fileUrl);
            return fileUrl;

        } catch (Exception e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传字节数组
     *
     * @param data        文件数据
     * @param contentType 文件类型
     * @param extension   文件扩展名
     * @return 文件访问 URL
     */
    public String uploadAudio(byte[] data, String contentType, String extension) {
        try {
            String objectName = "audio/" + UUID.randomUUID().toString() + extension;
            String bucketName = minioConfig.getBucketName();

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(new java.io.ByteArrayInputStream(data), data.length, -1)
                    .contentType(contentType)
                    .build());

            // 构建公开访问 URL
            String publicUrl = minioConfig.getPublicUrl();
            String fileUrl = publicUrl + "/" + bucketName + "/" + objectName;

            log.info("文件上传成功: {}", fileUrl);
            return fileUrl;

        } catch (Exception e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 删除文件
     *
     * @param objectName 对象名称
     */
    public void deleteFile(String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(minioConfig.getBucketName())
                    .object(objectName)
                    .build());
            log.info("文件删除成功: {}", objectName);
        } catch (Exception e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
        }
    }
}