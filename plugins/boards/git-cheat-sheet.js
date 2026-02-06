// Git Cheat Sheet Board
// Quick-reference note cards for common git commands
// Uses blank (note) tools with pre-filled markdown content

const gitCards = [
    {
        title: 'Setup & Config',
        content: `## Setup & Config

\`git init\` — Initialize a new repo
\`git clone <url>\` — Clone a repository
\`git config --global user.name "Name"\`
\`git config --global user.email "email"\`
\`git config --list\` — Show all config
\`git remote add origin <url>\`
\`git remote -v\` — List remotes`
    },
    {
        title: 'Basic Workflow',
        content: `## Basic Workflow

\`git status\` — Show working tree status
\`git add <file>\` — Stage a file
\`git add .\` — Stage all changes
\`git commit -m "msg"\` — Commit staged
\`git commit -am "msg"\` — Add + commit tracked
\`git push\` — Push to remote
\`git pull\` — Fetch + merge from remote
\`git fetch\` — Download remote changes`
    },
    {
        title: 'Branching',
        content: `## Branching

\`git branch\` — List branches
\`git branch <name>\` — Create branch
\`git checkout <name>\` — Switch branch
\`git checkout -b <name>\` — Create + switch
\`git switch <name>\` — Switch (modern)
\`git switch -c <name>\` — Create + switch
\`git branch -d <name>\` — Delete branch
\`git branch -m <new>\` — Rename current
\`git push -u origin <name>\` — Push new branch`
    },
    {
        title: 'Merging & Rebasing',
        content: `## Merging & Rebasing

\`git merge <branch>\` — Merge into current
\`git merge --no-ff <branch>\` — Merge commit always
\`git rebase <branch>\` — Rebase onto branch
\`git rebase -i HEAD~3\` — Interactive rebase
\`git cherry-pick <sha>\` — Apply a commit
\`git merge --abort\` — Cancel merge
\`git rebase --abort\` — Cancel rebase
\`git rebase --continue\` — After resolving`
    },
    {
        title: 'History & Diff',
        content: `## History & Diff

\`git log\` — Commit history
\`git log --oneline\` — Compact log
\`git log --graph --oneline\` — Visual graph
\`git log -p <file>\` — File change history
\`git diff\` — Unstaged changes
\`git diff --staged\` — Staged changes
\`git diff <a>..<b>\` — Between branches
\`git show <sha>\` — Show a commit
\`git blame <file>\` — Line-by-line author`
    },
    {
        title: 'Undo & Reset',
        content: `## Undo & Reset

\`git restore <file>\` — Discard changes
\`git restore --staged <file>\` — Unstage
\`git reset HEAD~1\` — Undo last commit (keep files)
\`git reset --hard HEAD~1\` — Undo + discard
\`git revert <sha>\` — Reverse a commit (safe)
\`git commit --amend\` — Edit last commit
\`git clean -fd\` — Remove untracked files
\`git reflog\` — Recovery log`
    },
    {
        title: 'Stash',
        content: `## Stash

\`git stash\` — Stash working changes
\`git stash push -m "msg"\` — Named stash
\`git stash list\` — List stashes
\`git stash pop\` — Apply + remove latest
\`git stash apply\` — Apply, keep stash
\`git stash apply stash@{2}\` — Apply specific
\`git stash drop stash@{0}\` — Delete a stash
\`git stash clear\` — Delete all stashes
\`git stash -u\` — Include untracked files`
    },
    {
        title: 'Tags & Releases',
        content: `## Tags & Releases

\`git tag\` — List tags
\`git tag v1.0.0\` — Lightweight tag
\`git tag -a v1.0.0 -m "msg"\` — Annotated tag
\`git tag -a v1.0.0 <sha>\` — Tag old commit
\`git push origin v1.0.0\` — Push a tag
\`git push origin --tags\` — Push all tags
\`git tag -d v1.0.0\` — Delete local tag
\`git push origin :refs/tags/v1.0.0\` — Delete remote`
    },
    {
        title: 'Advanced',
        content: `## Advanced

\`git bisect start\` — Binary search for bug
\`git bisect good/bad\` — Mark commits
\`git worktree add <path> <branch>\`
\`git submodule add <url>\`
\`git log --all --grep="text"\` — Search commits
\`git log -S "code"\` — Search changes (pickaxe)
\`git shortlog -sn\` — Commits per author
\`git archive -o out.zip HEAD\` — Export snapshot`
    }
];

// Register the board using blank notes for each card
const cols = 3;
const w = 290, h = 280, gap = 16, startX = 20, startY = 20;

PluginRegistry.registerBoard({
    id: 'git-cheat-sheet',
    name: 'Git Cheat Sheet',
    description: 'Quick-reference cards for everyday git commands',
    icon: '📖',
    version: '1.0.0',
    source: 'external',
    settings: {
        title: 'Git Cheat Sheet',
        color: '#e74c3c'
    },
    tools: gitCards.map((card, i) => ({
        toolId: 'blank',
        instanceId: 'git-card-' + i,
        title: card.title,
        customContent: card.content,
        position: {
            x: startX + (i % cols) * (w + gap),
            y: startY + Math.floor(i / cols) * (h + gap),
            z: 100 + i,
            width: w,
            height: h
        }
    }))
});

console.log('Git Cheat Sheet board loaded');
