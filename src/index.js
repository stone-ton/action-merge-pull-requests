const { getLastCommitSha, createAuxBranch, deleteBranch, getPrs, mergeBranchs, recreateDeployBranch, triggerDeploy } = require('./helper')

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
        } catch (error) {
            console.error(error.response.data.message)
            await deleteBranch(workBranchName)
            throw new Error('Merge conflict')
        }
    }

    await recreateDeployBranch(lastMergeCommitSha)

    await deleteBranch(workBranchName)

    await triggerDeploy()
}

run()
