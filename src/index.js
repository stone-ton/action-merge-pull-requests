const { getLastCommitSha, createAuxBranch, deleteBranch, getPrs, mergeBranchs, recreateDeployBranch } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommitSha()

    const workBranchName = await createAuxBranch(baseLastCommit)

    const pullRequests = await getPrs()


    let lastMergeCommitSha
    for (let pull of pullRequests) {
        try {
            console.log(`Merging PR ${pull.number}`)
            const { data } = await mergeBranchs(pull.head.ref)

            console.log(`Successful merge PR ${pull.number}`);
            
            lastMergeCommitSha = data.sha
        } finally {
            await deleteBranch(workBranchName)
        }
    }

    await recreateDeployBranch(lastMergeCommitSha)

    await deleteBranch(workBranchName)
}

run()
