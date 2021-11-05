const core = require('@actions/core');
const github = require('@actions/github');

const context = github.context;

const getHeadReleaseTag = async () => {
  console.log('Owner: ', context.owner);
  console.log('Repo: ', context.repo);
  const response = await octokit.rest.repos.getLatestRelease({
    owner: context.owner,
    repo: context.repo
  });
  console.log('Head release tag response: ', response);
  return response.data.tag_name;
}

const getDefaultBaseReleaseTag = async () => {
  const response = await octokit.rest.repos.listReleases({
    owner: context.owner,
    repo: context.repo
  });
  console.log('Base release tag response: ', response);
  return response.data[0].tag_name;
}

(async function() {
//  try {
    const token = core.getInput('token');
    octokit = github.getOctokit(token);
    console.log("Initiated octokit");

    const headReleaseTag = await getHeadReleaseTag()
    console.log("Head release tag: ", headReleaseTag);

    const baseReleaseTag = core.getInput('release-tag') || await getDefaultBaseReleaseTag();
    console.log("Base release tag: ", baseReleaseTag);
    
    const response = await octokit.request("GET /GET /repos/{owner}/{repo}/compare/{base}...{head}", {
      head: headReleaseTag,
      base: baseReleaseTag
    });
    console.log("response: ", JSON.stringify(response));
    const messages = response.commits.map(c => c.commit.message);
    core.setOutput('messages', messages.join(' '));
//  } catch (error) {
//     core.setFailed(error.message);
//  }
})()

