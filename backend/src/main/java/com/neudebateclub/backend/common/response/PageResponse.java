package com.neudebateclub.backend.common.response;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

@Data @Builder
public class PageResponse<T> {
    private List<T> data;
    private long total;
    private int page;
    private int limit;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrev;

    public static <T> PageResponse<T> of(Page<T> page, int pageNumber, int limit) {
        return PageResponse.<T>builder()
            .data(page.getContent())
            .total(page.getTotalElements())
            .page(pageNumber)
            .limit(limit)
            .totalPages(page.getTotalPages())
            .hasNext(page.hasNext())
            .hasPrev(page.hasPrevious())
            .build();
    }
}