---
name: GitHub publishing
description: Reliable way to publish repository commits through the authorized GitHub integration in this workspace.
---

Use the authenticated GitHub SDK client from the connected `github` integration for repository writes. A larger multi-file write through the connector proxy can fail with a durable sandbox serialization error even when no branch update occurred; verify the remote branch before retrying, then use the Git Data API to create blobs, a tree, a commit, and update the branch ref.

**Why:** The workspace's normal git transport may not have GitHub credentials, while the authorized connector can publish safely without exposing tokens.

**How to apply:** Confirm the remote branch SHA first, build from the local HEAD, update the ref without force, and verify the resulting remote commit SHA afterward.