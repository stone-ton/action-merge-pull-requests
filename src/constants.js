const deployBranchName = 'sdx-prs-deploy'
const deployRefName = `heads/${deployBranchName}`
const deployRefHead = `refs/${deployRefName}`

const token = process.env.GITHUB_TOKEN
const sdx = process.env.SDX_BRANCH_NAME || 'sdx'
const ref = `heads/${sdx}`

const repoInfo = {
    owner: process.env.OWNER,
    repo: process.env.REPO,
}

module.exports =  {
    deployBranchName,
    deployRefName,
    deployRefHead,
    repoInfo,
    token,
    ref,
}
