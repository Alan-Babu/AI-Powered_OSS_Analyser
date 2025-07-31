package com.ossrisk.oss.utility;

import org.eclipse.jgit.api.Git;

import java.io.File;

public class GitCloner {
    public static File cloneRepo(String repoUrl) {
        try{
            String localPath = "./cloned-repos/"+System.currentTimeMillis();
            Git.cloneRepository()
                    .setURI(repoUrl)
                    .setDirectory(new File(localPath))
                    .call();
            return new File(localPath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to clone repo: " + repoUrl, e);
        }

    }
}
