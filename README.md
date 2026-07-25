# repo-template
PassiveBolt Repository Template

# Required workflow helpers
## Husky
Husky enforces commit message styles and runs commands for specific events. The following commands will install and activate it on your system.

```
npm install
npm run prepare
```

# Branch Names
When creating a new branch to work on please use the following format so that we get links to the code in jira:
<JiraBoard>-<TicketNumber>-<Ticket-Name>, e.g. KVR-1-Test-Ticket. Ticket names may be approximated for length if necessary.

# Commit Messages
commitlint checks if your commit messages meet the conventional commit format.

In general the pattern mostly looks like this:

type(scope?): subject  #scope is optional; multiple scopes are supported (current delimiter options: "/", "\" and ",")

Real world examples can look like this:
chore: run tests on travis ci fix(server): send cors headers feat(blog): add comment section Common types according to commitlint-config-conventional (based on the Angular convention) can be:

build
chore
ci
docs
feat
fix
perf
refactor
revert
style
test