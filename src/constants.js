const deployBranchName = 'sdx-prs-deploy'
const deployRefName = `heads/${deployBranchName}`
const deployRefHead = `refs/${deployRefName}`

const token = process.env.INPUT_TOKEN
const sdx = process.env.INPUT_SDX_BRANCH_NAME || 'sdx'
const ref = `heads/${sdx}`

const repoInfo = {
    owner: process.env.INPUT_OWNER,
    repo: process.env.GITHUB_REPOSITORY,
}

console.log(repoInfo);

module.exports =  {
    deployBranchName,
    deployRefName,
    deployRefHead,
    repoInfo,
    token,
    ref,
}
