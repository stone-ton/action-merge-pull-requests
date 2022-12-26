# acton
Aqui rodamos tudo, o que não falta é Action


```
git branch -D merge-push-on
git checkout -b merge-push-on origin/pull-requests-base-branch
git fetch prs-to-pull-requests-base-branch
for pr in prs
    git merge pr on  merge-push-on
    if conflict 
        return error

git push -f origin HEAD:merge-push-on
```
