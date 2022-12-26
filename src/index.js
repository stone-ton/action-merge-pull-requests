const { getLastCommit, createBranch, deleteBranch, getPrs, mergeBranchs, updateDeployRef } = require('./helper')

async function run() {
    const baseLastCommit = await getLastCommit()

    const workBranchName = await createBranch(baseLastCommit.sha)

    const pullRequests = await getPrs()


    let lastMergeCommitSha
    for (let pull of pullRequests) {
        try {
            const { data } = await mergeBranchs(pull.head.ref, workBranchName)
            lastMergeCommitSha = data.sha
        } catch (error) {
            console.error(error.response.data.message)
            throw new Error('Merge conflict')
        }
    }

    await updateDeployRef(sha)

    await deleteBranch(workBranchName)
}

run()
