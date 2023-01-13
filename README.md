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

```
exemplo com:
    merge-push-on = sdx
    pull-requests-base-branch = master

git checkout -b sdx-${timestamp} origin/master
git fetch prs-to-master
for pr in prs
    git merge pr on sdx-${timestamp}
    if conflict
        git branch -d sdx-${timestamp}
        return error

git branch -d sdx
git checkout -b sdx
git branch -d sdx-${timestamp}
```