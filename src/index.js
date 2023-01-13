const { getLastCommitSha, createAuxBranch, deleteBranch, getPrs, mergeBranchs, recreateDeployBranch } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommitSha()

    const workBranchName = await createAuxBranch(baseLastCommit)

    const pullRequests = await getPrs()

    try {
        let lastMergeCommitSha
        for (let pull of pullRequests) {
            console.log(`Merging PR ${pull.number}`)
            const { data } = await mergeBranchs(pull.head.ref)

            console.log(`Successful merge PR ${pull.number}`);
            
            lastMergeCommitSha = data.sha
        }
        await recreateDeployBranch(lastMergeCommitSha)
    } finally {
        await deleteBranch(workBranchName)
    }
}

run()
