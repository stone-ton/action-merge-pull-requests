const deployBranchName = process.env.INPUT_WORK_BRANCH_NAME
const deployRefName = `heads/${deployBranchName}`
const deployRefHead = `refs/${deployRefName}`

const token = process.env.INPUT_TOKEN
const sdx = process.env.INPUT_BASE
const ref = `heads/${sdx}`

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

const repoInfo = { owner, repo }

module.exports =  {
    deployBranchName,
    deployRefName,
    deployRefHead,
    repoInfo,
    token,
    ref,
}
