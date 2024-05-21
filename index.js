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
    const continueOnError = core.getInput('continue-on-error') === 'true';

    const octokit = github.getOctokit(token);
    console.log("Initiated octokit");

    let baseReleaseTag, headReleaseTag;
    if (context.payload.pull_request) {
      baseReleaseTag = context.payload.pull_request.base.sha;
      headReleaseTag = context.payload.pull_request.head.sha;
      console.log("Running on Pull Request");
    } else {
      headReleaseTag = await getHeadReleaseTag();
      baseReleaseTag = core.getInput('release-tag') || await getDefaultBaseReleaseTag();
      console.log("Running on Release");
    }

    console.log("Base release tag: ", baseReleaseTag);
    console.log("Head release tag: ", headReleaseTag);
    
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
    if (!continueOnError) {
     core.setFailed(error.message);
    } else {
     core.setOutput('issue-keys', ''); 
    }
  }
})();
