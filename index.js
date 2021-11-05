const core = require('@actions/core');
const github = require('@actions/github');

let octokit = undefined;

const getHeadReleaseTag = async () => {
  const response = await octokit.request("GET /repos/{owner}/{repo}/releases/latest", {
    owner: github.context.owner,
    repo: github.context.repo
  });
  return response.tag_name;
}

const getDefaultBaseReleaseTag = async () => {

}

(async function() {
  try {
    const token = core.getInput('token');
    octokit = github.getOctokit(token);
    const headReleaseTag = getHeadReleaseTag()
    const baseReleaseTag = core.getInput('release-tag') || await getDefaultBaseReleaseTag();
    
    const response = await octokit.request("GET /GET /repos/{owner}/{repo}/compare/{base}...{head}", {
      head: headReleaseTag,
      base: baseReleaseTag
    });
    const messages = response.commits.map(c => c.commit.message);
    core.setOutput('messages', messages.join(' '));
  } catch (error) {
     core.setFailed(error.message);
  }
})()

