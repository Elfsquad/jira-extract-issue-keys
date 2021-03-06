const core = require('@actions/core');
const github = require('@actions/github');

const context = github.context;

const getHeadReleaseTag = async () => {
  const response = await octokit.rest.repos.getLatestRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
  return response.data.tag_name;
}

const getDefaultBaseReleaseTag = async () => {
  const response = await octokit.rest.repos.listReleases({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
  return response.data[1].tag_name;
}

(async function() {
  try {
    const token = core.getInput('token');
    octokit = github.getOctokit(token);
    console.log("Initiated octokit");

    const headReleaseTag = await getHeadReleaseTag()
    console.log("Head release tag: ", headReleaseTag);

    const baseReleaseTag = core.getInput('release-tag') || await getDefaultBaseReleaseTag();
    console.log("Base release tag: ", baseReleaseTag);
    
    const continueOnError = core.getInput('continue-on-error');
    
    const response = await octokit.rest.repos.compareCommitsWithBasehead({
      owner: context.repo.owner,
      repo: context.repo.repo,
      basehead: `${baseReleaseTag}...${headReleaseTag}`,
    });
    const messages = (response.data.commits.map(c => c.commit.message) || []).join('');
    const regex = /[A-Z]{2,}-\d+/g; 
    const issueKeys = messages.match(regex);

    if (!issueKeys || issueKeys.length == 0) {
      if (!continueOnError) {
        throw new Error("No issue keys found"); 
      }
    }
    core.setOutput('issue-keys', issueKeys.join(','));
  } catch (error) {
    if (!continueOnerror) {
     core.setFailed(error.message);
    } else {
     core.setOutput('issue-keys', ''); 
    }
  }
})()
