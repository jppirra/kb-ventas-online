package com.jafpsoft.ventas.dto.profile;

import com.jafpsoft.ventas.model.SocialLink;
import lombok.Data;

@Data
public class SocialLinkDto {
    private Long id;
    private String platform;
    private String url;
    private Integer sortOrder;

    public static SocialLinkDto from(SocialLink s) {
        SocialLinkDto d = new SocialLinkDto();
        d.id = s.getId();
        d.platform = s.getPlatform();
        d.url = s.getUrl();
        d.sortOrder = s.getSortOrder();
        return d;
    }
}
