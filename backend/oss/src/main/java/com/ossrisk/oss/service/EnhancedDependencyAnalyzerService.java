package com.ossrisk.oss.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ossrisk.oss.model.Dependency;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EnhancedDependencyAnalyzerService {

    @Value("${ossindex.api.url:https://ossindex.sonatype.org/api/v3/component-report}")
    private String ossIndexUrl;

    @Value("${ossindex.api.username:}")
    private String ossIndexUsername;

    @Value("${ossindex.api.token:}")
    private String ossIndexToken;

    @Value("${github.api.url:https://api.github.com}")
    private String githubApiUrl;

    @Value("${github.api.token:}")
    private String githubToken;

    @Value("${npm.api.url:https://registry.npmjs.org}")
    private String npmApiUrl;

    @Value("${pypi.api.url:https://pypi.org/pypi}")
    private String pypiApiUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public EnhancedDependencyAnalyzerService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Dependency> analyze(File repoDir) {
        List<Dependency> allDeps = new ArrayList<>();

        try {
            Files.walk(repoDir.toPath(), Integer.MAX_VALUE)
                    .filter(Files::isRegularFile)
                    .forEach(path -> {
                        String fileName = path.getFileName().toString();
                        System.out.println("Analyzing path: " + path.toString());
                        try {
                            String filename_lower = fileName.toLowerCase();
                            if (filename_lower.equals("pom.xml")) {
                                allDeps.addAll(parseMavenDependencies(path.toFile()));
                            } else if (filename_lower.equals("package.json")) {
                                allDeps.addAll(parseNpmDependencies(path.toFile()));
                            } else if (filename_lower.equals("requirements.txt") || filename_lower.equals("requirement.txt")) {
                                allDeps.addAll(parsePythonDependencies(path.toFile()));
                            }
                        } catch (Exception e) {
                            System.err.println("Failed to parse: " + fileName + " - " + e.getMessage());
                        }
                    });
        } catch (IOException e) {
            e.printStackTrace();
        }

        // Enhance dependencies with real data from APIs
        List<Dependency> enhancedDeps = new ArrayList<>();
        for (Dependency dep : allDeps) {
            try {
                enhancedDeps.add(enhanceDependencyWithApiData(dep));
            } catch (Exception e) {
                System.err.println("Failed to enhance dependency " + dep.getName() + ": " + e.getMessage());
                enhancedDeps.add(dep); // Add original dependency if enhancement fails
            }
        }

        return new ArrayList<>(new HashSet<>(enhancedDeps));
    }

    private Dependency enhanceDependencyWithApiData(Dependency dep) {
        try {
            // Get vulnerability data from OSSIndex
            Map<String, Object> vulnerabilityData = getVulnerabilityData(dep);
            
            // Get package metadata based on ecosystem
            Map<String, Object> packageData = getPackageMetadata(dep);
            
            // Enhance dependency with real data
            dep.setVulnerable((Boolean) vulnerabilityData.getOrDefault("hasVulnerabilities", false));
            dep.setOutdated((Boolean) packageData.getOrDefault("isOutdated", false));
            
            // Set additional metadata
            if (packageData.containsKey("lastUpdated")) {
                dep.setLastUpdated((String) packageData.get("lastUpdated"));
            }
            if (packageData.containsKey("downloadCount")) {
                dep.setDownloadCount((Integer) packageData.get("downloadCount"));
            }
            if (packageData.containsKey("starCount")) {
                dep.setStarCount((Integer) packageData.get("starCount"));
            }
            if (packageData.containsKey("maintainerCount")) {
                dep.setMaintainerCount((Integer) packageData.get("maintainerCount"));
            }
            if (packageData.containsKey("description")) {
                dep.setDescription((String) packageData.get("description"));
            }
            if (packageData.containsKey("homepage")) {
                dep.setHomepage((String) packageData.get("homepage"));
            }
            if (packageData.containsKey("repository")) {
                dep.setRepository((String) packageData.get("repository"));
            }
            
        } catch (Exception e) {
            System.err.println("Error enhancing dependency " + dep.getName() + ": " + e.getMessage());
        }
        
        return dep;
    }

    private Map<String, Object> getVulnerabilityData(Dependency dep) {
        Map<String, Object> result = new HashMap<>();
        result.put("hasVulnerabilities", false);
        result.put("vulnerabilityCount", 0);
        
        try {
            // Create OSS Index request (expects an array of purls)
            Map<String, Object> request = new HashMap<>();
            request.put("coordinates", Collections.singletonList(buildCoordinate(dep)));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "OSS-Risk-Analyzer/1.0 (+https://github.com)");
            
            if (!ossIndexUsername.isEmpty() && !ossIndexToken.isEmpty()) {
                String auth = ossIndexUsername + ":" + ossIndexToken;
                headers.set("Authorization", "Basic " + Base64.getEncoder().encodeToString(auth.getBytes()));
            }
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            // Basic retry for transient 5xx
            int attempts = 0;
            while (attempts < 3) {
                attempts++;
                ResponseEntity<JsonNode> response = restTemplate.exchange(
                    ossIndexUrl,
                    HttpMethod.POST,
                    entity,
                    JsonNode.class
                );
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode body = response.getBody();
                    if (body.isArray() && body.size() > 0) {
                        JsonNode component = body.get(0);
                        boolean hasVulns = component.has("vulnerabilities") && component.get("vulnerabilities").size() > 0;
                        result.put("hasVulnerabilities", hasVulns);
                        result.put("vulnerabilityCount", hasVulns ? component.get("vulnerabilities").size() : 0);
                    }
                    break;
                }
                if (response.getStatusCode().is5xxServerError() && attempts < 3) {
                    try { Thread.sleep(500L * attempts); } catch (InterruptedException ignored) {}
                    continue;
                }
                break;
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching vulnerability data for " + dep.getName() + ": " + e.getMessage());
            // leave defaults; downstream will treat as unknown
        }
        
        return result;
    }

    private Map<String, Object> getPackageMetadata(Dependency dep) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            switch (dep.getEcosystem().toLowerCase()) {
                case "npm":
                    result = getNpmPackageData(dep);
                    break;
                case "pypi":
                    result = getPypiPackageData(dep);
                    break;
                case "maven":
                    result = getMavenPackageData(dep);
                    break;
                default:
                    result.put("isOutdated", false);
            }
        } catch (Exception e) {
            System.err.println("Error fetching package metadata for " + dep.getName() + ": " + e.getMessage());
            result.put("isOutdated", false);
        }
        
        return result;
    }

    private Map<String, Object> getNpmPackageData(Dependency dep) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String url = npmApiUrl + "/" + dep.getName();
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode packageData = response.getBody();
                
                // Get latest version
                String latestVersion = packageData.path("dist-tags").path("latest").asText();
                boolean isOutdated = !dep.getVersion().equals(latestVersion);
                
                // Get time data
                JsonNode time = packageData.path("time");
                String lastModified = time.path("modified").asText();
                
                // Get repository info
                JsonNode repository = packageData.path("repository");
                String repoUrl = repository.path("url").asText();
                
                result.put("isOutdated", isOutdated);
                result.put("latestVersion", latestVersion);
                result.put("lastUpdated", lastModified);
                result.put("description", packageData.path("description").asText());
                result.put("homepage", packageData.path("homepage").asText());
                result.put("repository", repoUrl);
                
                // Get download stats (if available)
                if (packageData.has("downloads")) {
                    result.put("downloadCount", packageData.path("downloads").path("total").asInt());
                }
                
                // Try to get GitHub data if repository is on GitHub
                if (repoUrl.contains("github.com")) {
                    Map<String, Object> githubData = getGitHubRepoData(repoUrl);
                    result.putAll(githubData);
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching NPM data for " + dep.getName() + ": " + e.getMessage());
        }
        
        return result;
    }

    private Map<String, Object> getPypiPackageData(Dependency dep) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String url = pypiApiUrl + "/" + dep.getName() + "/json";
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode packageData = response.getBody();
                
                // Get latest version
                JsonNode info = packageData.path("info");
                String latestVersion = info.path("version").asText();
                boolean isOutdated = !dep.getVersion().equals(latestVersion);
                
                result.put("isOutdated", isOutdated);
                result.put("latestVersion", latestVersion);
                result.put("description", info.path("summary").asText());
                result.put("homepage", info.path("home_page").asText());
                
                // Get repository info
                JsonNode projectUrls = info.path("project_urls");
                if (projectUrls.has("Repository")) {
                    String repoUrl = projectUrls.path("Repository").asText();
                    result.put("repository", repoUrl);
                    
                    // Try to get GitHub data
                    if (repoUrl.contains("github.com")) {
                        Map<String, Object> githubData = getGitHubRepoData(repoUrl);
                        result.putAll(githubData);
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching PyPI data for " + dep.getName() + ": " + e.getMessage());
        }
        
        return result;
    }

    private Map<String, Object> getMavenPackageData(Dependency dep) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Maven Central API
            String url = "https://search.maven.org/solrsearch/select?q=g:" + dep.getName() + "&rows=1&wt=json";
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode searchData = response.getBody();
                JsonNode responseData = searchData.path("response");
                
                if (responseData.path("numFound").asInt() > 0) {
                    JsonNode doc = responseData.path("docs").get(0);
                    String latestVersion = doc.path("latestVersion").asText();
                    boolean isOutdated = !dep.getVersion().equals(latestVersion);
                    
                    result.put("isOutdated", isOutdated);
                    result.put("latestVersion", latestVersion);
                    result.put("description", doc.path("description").asText());
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching Maven data for " + dep.getName() + ": " + e.getMessage());
        }
        
        return result;
    }

    private Map<String, Object> getGitHubRepoData(String repoUrl) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (githubToken.isEmpty()) {
                return result; // Skip if no GitHub token
            }
            
            // Extract owner and repo from URL
            String[] parts = repoUrl.replace("https://github.com/", "").split("/");
            if (parts.length >= 2) {
                String owner = parts[0];
                String repo = parts[1].replace(".git", "");
                
                String url = githubApiUrl + "/repos/" + owner + "/" + repo;
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", "token " + githubToken);
                headers.set("Accept", "application/vnd.github.v3+json");
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode repoData = response.getBody();
                    
                    result.put("starCount", repoData.path("stargazers_count").asInt());
                    result.put("forkCount", repoData.path("forks_count").asInt());
                    result.put("issueCount", repoData.path("open_issues_count").asInt());
                    result.put("lastUpdated", repoData.path("updated_at").asText());
                    
                    // Get contributors count
                    String contributorsUrl = url + "/contributors";
                    ResponseEntity<JsonNode> contributorsResponse = restTemplate.exchange(
                        contributorsUrl, HttpMethod.GET, entity, JsonNode.class
                    );
                    
                    if (contributorsResponse.getStatusCode().is2xxSuccessful() && contributorsResponse.getBody() != null) {
                        result.put("maintainerCount", contributorsResponse.getBody().size());
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("Error fetching GitHub data: " + e.getMessage());
        }
        
        return result;
    }

    private String buildCoordinate(Dependency dep) {
        switch (dep.getEcosystem().toLowerCase()) {
            case "npm":
                return "pkg:npm/" + dep.getName() + "@" + dep.getVersion();
            case "pypi":
                return "pkg:pypi/" + dep.getName() + "@" + dep.getVersion();
            case "maven":
                return "pkg:maven/" + dep.getName() + "@" + dep.getVersion();
            default:
                return "pkg:unknown/" + dep.getName() + "@" + dep.getVersion();
        }
    }

    // Original parsing methods (unchanged)
    private List<Dependency> parseMavenDependencies(File pomFile) throws Exception {
        List<Dependency> dependencies = new ArrayList<>();
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(pomFile);
        NodeList deps = doc.getElementsByTagName("dependency");

        for (int i = 0; i < deps.getLength(); i++) {
            Element dep = (Element) deps.item(i);
            String artifactId = getTagValue("artifactId", dep);
            String version = getTagValue("version", dep);
            if (artifactId != null && version != null) {
                dependencies.add(new Dependency(artifactId, version, false, false, "maven"));
            }
        }
        return dependencies;
    }

    private List<Dependency> parseNpmDependencies(File jsonFile) throws IOException {
        List<Dependency> dependencies = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(jsonFile);
        JsonNode deps = root.path("dependencies");

        if(!deps.isMissingNode()){
            Iterator<String> fieldNames = deps.fieldNames();
            while (fieldNames.hasNext()) {
                String name = fieldNames.next();
                String version = deps.get(name).asText();
                dependencies.add(new Dependency(name, version.replace("^", ""), false, false, "npm"));
            }
        }
        return dependencies;
    }

    private List<Dependency> parsePythonDependencies(File reqsFile) throws IOException {
        List<Dependency> dependencies = new ArrayList<>();
        List<String> lines = Files.readAllLines(reqsFile.toPath());
        for (String line : lines) {
            if(line.isBlank() || line.startsWith("#")) continue;
            String[] parts = line.split("==");
            if (parts.length == 2) {
                dependencies.add(new Dependency(parts[0].trim(), parts[1].trim(), false, false,"pypi"));
            }
        }
        return dependencies;
    }

    private String getTagValue(String tag, Element element) {
        NodeList nodeList = element.getElementsByTagName(tag);
        if (nodeList.getLength() > 0) {
            Node node = nodeList.item(0);
            return node.getTextContent();
        }
        return null;
    }
}
