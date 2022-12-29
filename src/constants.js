const deployBranchName = process.env.INPUT_MERGE_PUSH_ON
const deployRefName = `heads/${deployBranchName}`
const deployRefHead = `refs/${deployRefName}`

const token = process.env.INPUT_TOKEN
const target = process.env.INPUT_PULL_REQUESTS_BASE_BRANCH
const ref = `heads/${target}`

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

const repoInfo = { owner, repo }

const deployWorkflow = process.env.INPUT_DEPLOY_WORKFLOW
const workflowSourceBranch = process.env.INPUT_WORKFLOW_BRANCH_ORIGIN

module.exports =  {
    deployBranchName,
    deployWorkflow,
    workflowSourceBranch,
    deployRefName,
    deployRefHead,
    repoInfo,
    token,
    target,
    ref,
}
