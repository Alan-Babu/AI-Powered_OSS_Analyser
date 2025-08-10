package com.ossrisk.oss.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Service
public class NlpClient {

    private final WebClient webClient;


    public NlpClient(WebClient.Builder builder){
        this.webClient =   builder.baseUrl("http://localhost:8001").build();

    }

    public Map<String,Object>extractFixandRemediation(String descritption){
        try{
            return webClient.post()
                    .uri("/nlp/extract")
                    .bodyValue(Map.of("description",descritption))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .onErrorResume(e->{
                        log.error("NLP Service call Failed: {}", e.getMessage());
                        return Mono.just(Map.of(
                                "fixVersion", "No Fix Yet",
                                "remediation","No Remediation Provided",
                                "confidence", 0.0
                        ));
                    })
                    .block();
        }catch (Exception e){
            log.error("Error Calling NLP Service: {}",e.getMessage());
            return Map.of(
                    "fixVersion", "No Fix Yet",
                    "remediation","No Remediation Provided",
                    "confidence", 0.0
            );
        }
    }

    public String getFixVersion(String description) {
        Map<String, Object> result = extractFixandRemediation(description);
        Object fixVersion = result.get("fixVersion");
        return fixVersion != null ? fixVersion.toString() : "No Fix Yet";
    }

    public String getRemediation(String description) {
        Map<String, Object> result = extractFixandRemediation(description);
        Object remediation = result.get("remediation");
        return remediation != null ? remediation.toString() : "No Remediation Provided";
    }

}
