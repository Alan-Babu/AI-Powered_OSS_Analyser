package com.ossrisk.oss.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ossrisk.oss.model.Dependency;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.security.PublicKey;
import java.util.Iterator;
import java.util.List;
import java.util.ArrayList;
import java.io.File;

@Service
public class DependencyAnalyzerService {
    public List<Dependency> analysePom(File repoDir){
        List<Dependency> dependencies = new ArrayList<>();
        File pomFile = new File(repoDir,"pom.xml");

        try{
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(pomFile);
            NodeList deps = doc.getElementsByTagName("dependency");

            for(int i=0;i< deps.getLength();i++){
                Element dep = (Element) deps.item(i);
                String groupId = dep.getElementsByTagName("groupId").item(0).getTextContent();
                String artifactId = dep.getElementsByTagName("artifactId").item(0).getTextContent();
                String version = dep.getElementsByTagName("version").item(0).getTextContent();

                dependencies.add(new Dependency(0L, artifactId, version, false, false));
            }

        }catch(Exception e) {
            e.printStackTrace();
        }
        return dependencies;
    }

    public List<Dependency> analyseJsonPackage(File repoDir){
        List<Dependency> dependencies = new ArrayList<>();
        File jsonFile = new File(repoDir,"package.json");

        try{
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonFile);
            JsonNode deps = root.path("dependencies");

            Iterator<String> fieldNames = deps.fieldNames();
            while(fieldNames.hasNext()){
                String name = fieldNames.next();
                String version = deps.get(name).asText();
                dependencies.add(new Dependency(0L,name,version,false,false));
            }
        } catch (IOException e){
            e.printStackTrace();
        }

        return dependencies;
    }

    public List<Dependency> analyze(File repoDir){
        if(new File(repoDir,"pom.xml").exists()){
            return analysePom(repoDir);
        }else if(new File(repoDir, "package.json").exists()){
            return analyseJsonPackage(repoDir);
        }
        return List.of();
    }
}
