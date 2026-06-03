package com.api.framework.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AddPlaceResponse {
    private String status;
    private String place_id;
    private String scope;
    private String reference;
    private String id;
}