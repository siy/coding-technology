#!/usr/bin/env bash
# Counts the method-rung adoption event: audit reports filed by someone other than the owner.
#
# Decision 4 of the 2026-09-04 roadmap conference defines the event as a non-owner post in the
# audits category. This is that count, and it is deliberately the whole instrument: no telemetry,
# no per-reader tracking, and a known undercount (some readers will not post publicly).
#
# Usage: ai-tools/count-audits.sh [category-slug]    (default: audits)
set -euo pipefail

OWNER=siy
REPO=coding-technology
OWNER_LOGIN=siy                     # posts by this account are ours, not adoption
CATEGORY="${1:-audits}"

CAT_ID=$(gh api graphql -f query='
  query($owner:String!,$repo:String!){
    repository(owner:$owner,name:$repo){
      discussionCategories(first:50){nodes{id slug}}}}' \
  -F owner="$OWNER" -F repo="$REPO" \
  --jq ".data.repository.discussionCategories.nodes[]|select(.slug==\"$CATEGORY\").id")

if [ -z "$CAT_ID" ]; then
  echo "No discussion category with slug '$CATEGORY' in $OWNER/$REPO." >&2
  echo "Create it in repository settings; the form at .github/DISCUSSION_TEMPLATE/$CATEGORY.yml" >&2
  echo "only applies to a category whose slug matches its filename." >&2
  exit 1
fi

gh api graphql --paginate -f query='
  query($owner:String!,$repo:String!,$cat:ID!,$endCursor:String){
    repository(owner:$owner,name:$repo){
      discussions(first:100, categoryId:$cat, after:$endCursor){
        pageInfo{hasNextPage endCursor}
        nodes{ number title createdAt author{login} }}}}' \
  -F owner="$OWNER" -F repo="$REPO" -F cat="$CAT_ID" \
  --jq '.data.repository.discussions.nodes[]' \
| jq -s -r --arg owner "$OWNER_LOGIN" --arg cat "$CATEGORY" '
    { total: length, theirs: [ .[] | select((.author.login // "") != $owner) ] }
    | "category: \($cat)",
      "total posts:      \(.total)",
      "NON-OWNER posts:  \(.theirs | length)   <- the adoption event",
      ( .theirs | sort_by(.createdAt)[]
        | "  \(.createdAt[0:10])  \(.author.login // "ghost")  #\(.number)  \(.title[0:60])" )
  '
