package com.ossrisk.oss.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.context.annotation.Primary;
// Prometheus metrics will be auto-configured by Spring Boot Actuator
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.jvm.ExecutorServiceMetrics;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    @Bean(name = "repositoryProcessorExecutor")
    @Primary
    public Executor repositoryProcessorExecutor(MeterRegistry meterRegistry) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4); // Increased for better throughput
        executor.setMaxPoolSize(20); // Increased for handling bursts
        executor.setQueueCapacity(500); // Increased queue capacity
        executor.setThreadNamePrefix("RepoProcessor-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setKeepAliveSeconds(300); // 5 minutes keep-alive
        executor.setAllowCoreThreadTimeOut(true);
        executor.initialize();
        
        // Add metrics monitoring
        ExecutorServiceMetrics.monitor(meterRegistry, executor.getThreadPoolExecutor(), "repository-processor");
        
        return executor;
    }

    @Bean(name = "vulnerabilityCheckerExecutor")
    public Executor vulnerabilityCheckerExecutor(MeterRegistry meterRegistry) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5); // Increased for parallel vulnerability checks
        executor.setMaxPoolSize(25); // Increased for concurrent scanning
        executor.setQueueCapacity(1000); // Increased for bulk operations
        executor.setThreadNamePrefix("VulnChecker-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setKeepAliveSeconds(300);
        executor.setAllowCoreThreadTimeOut(true);
        executor.initialize();
        
        ExecutorServiceMetrics.monitor(meterRegistry, executor.getThreadPoolExecutor(), "vulnerability-checker");
        
        return executor;
    }

    @Bean(name = "aiMlProcessorExecutor")
    public Executor aiMlProcessorExecutor(MeterRegistry meterRegistry) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3); // Optimized for AI/ML workloads
        executor.setMaxPoolSize(12); // Increased for parallel AI processing
        executor.setQueueCapacity(200); // Increased for AI model inference
        executor.setThreadNamePrefix("AIML-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setKeepAliveSeconds(300);
        executor.setAllowCoreThreadTimeOut(true);
        executor.initialize();
        
        ExecutorServiceMetrics.monitor(meterRegistry, executor.getThreadPoolExecutor(), "ai-ml-processor");
        
        return executor;
    }

    @Bean(name = "cacheRefreshExecutor")
    public Executor cacheRefreshExecutor(MeterRegistry meterRegistry) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("CacheRefresh-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setKeepAliveSeconds(300);
        executor.setAllowCoreThreadTimeOut(true);
        executor.initialize();
        
        ExecutorServiceMetrics.monitor(meterRegistry, executor.getThreadPoolExecutor(), "cache-refresh");
        
        return executor;
    }
}
