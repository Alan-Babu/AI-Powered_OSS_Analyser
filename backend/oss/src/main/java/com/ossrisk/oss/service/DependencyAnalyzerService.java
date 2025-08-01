// === File: service/DependencyAnalyzerService.java ===
package com.ossrisk.oss.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ossrisk.oss.model.Dependency;
import org.springframework.stereotype.Service;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class DependencyAnalyzerService {

    public List<Dependency> analyze(File repoDir) {
        List<Dependency> allDeps = new ArrayList<>();

        try {
            Files.walk(repoDir.toPath())
                    .filter(Files::isRegularFile)
                    .forEach(path -> {
                        String fileName = path.getFileName().toString();
                        try {
                            if (fileName.equals("pom.xml")) {
                                allDeps.addAll(parseMavenDependencies(path.toFile()));
                            } else if (fileName.equals("package.json")) {
                                allDeps.addAll(parseNpmDependencies(path.toFile()));
                            } else if (fileName.equals("requirements.txt")) {
                                allDeps.addAll(parsePythonDependencies(path.toFile()));
                            }
                        } catch (Exception e) {
                            System.err.println("Failed to parse: " + fileName + " - " + e.getMessage());
                        }
                    });
        } catch (IOException e) {
            e.printStackTrace();
        }

        return allDeps;
    }

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
                dependencies.add(new Dependency(null, artifactId, version, false, false, "maven"));
            }
        }
        return dependencies;
    }

    private List<Dependency> parseNpmDependencies(File jsonFile) throws IOException {
        List<Dependency> dependencies = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(jsonFile);
        JsonNode deps = root.path("dependencies");

        Iterator<String> fieldNames = deps.fieldNames();
        while (fieldNames.hasNext()) {
            String name = fieldNames.next();
            String version = deps.get(name).asText();
            dependencies.add(new Dependency(null, name, version.replace("^", ""), false, false,"npm"));
        }
        return dependencies;
    }

    private List<Dependency> parsePythonDependencies(File reqsFile) throws IOException {
        List<Dependency> dependencies = new ArrayList<>();
        List<String> lines = Files.readAllLines(reqsFile.toPath());
        for (String line : lines) {
            String[] parts = line.split("==");
            if (parts.length == 2) {
                dependencies.add(new Dependency(null, parts[0].trim(), parts[1].trim(), false, false,"pypi"));
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
