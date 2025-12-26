# Git History Cleanup Guide

## ⚠️ CRITICAL: Removing Secrets from Git History

The `.env` file containing sensitive secrets was committed to git in commit `5a326e3f4cc7f47a93c98a03b118e5f18fc0d308`. Simply adding `.env` to `.gitignore` and removing it from the working directory **is not enough** - the secrets remain in git history and can be accessed by anyone who clones the repository.

## Why This Matters

- Anyone who has ever cloned this repository has access to the secrets
- Anyone who clones the repository in the future will have access to the secrets
- The secrets are publicly visible if this is a public repository
- Deleting the file or adding it to `.gitignore` does **not** remove it from git history

## Required Steps

### Step 1: Rotate ALL Credentials (URGENT - Do This First!)

Before cleaning git history, you **must** rotate all exposed credentials to prevent unauthorized access:

1. **Supabase Service Key**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Generate a new service_role key
   - Update your local `.env` file with the new key
   - Securely share the new key with team members (do not commit it!)

2. **Supabase Anon Key**:
   - In the same Supabase API settings
   - Generate a new anon/public key
   - Update your local `.env` file

3. **JWT Secret**:
   - Generate a new cryptographically secure random string (minimum 32 characters)
   - You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Update your local `.env` file

4. **Verify Changes**:
   - Ensure your application still works with the new credentials
   - Test authentication and database access

### Step 2: Clean Git History

**⚠️ WARNING**: This will rewrite git history. All team members must re-clone the repository after this is done.

#### Option A: Using BFG Repo-Cleaner (Recommended - Faster)

1. **Download BFG Repo-Cleaner**:
   ```bash
   # Download from https://rtyley.github.io/bfg-repo-cleaner/
   # Or with brew: brew install bfg
   ```

2. **Clone a fresh bare copy of the repository**:
   ```bash
   git clone --mirror git@github.com:Azieltan/smartboard-fyp.git
   ```

3. **Run BFG to remove the .env file**:
   ```bash
   bfg --delete-files .env smartboard-fyp.git
   ```

4. **Clean up and push**:
   ```bash
   cd smartboard-fyp.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

#### Option B: Using git filter-branch (Built-in but Slower)

1. **Backup your repository**:
   ```bash
   cd /path/to/smartboard-fyp
   git clone . ../smartboard-fyp-backup
   ```

2. **Remove the .env file from all commits**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch apps/backend/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Clean up**:
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Force push** (⚠️ This will rewrite history on the remote):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

#### Option C: Using git filter-repo (Modern Alternative)

1. **Install git-filter-repo**:
   ```bash
   pip install git-filter-repo
   # or: brew install git-filter-repo
   ```

2. **Remove the file**:
   ```bash
   git filter-repo --path apps/backend/.env --invert-paths
   ```

3. **Force push**:
   ```bash
   git remote add origin git@github.com:Azieltan/smartboard-fyp.git
   git push origin --force --all
   git push origin --force --tags
   ```

### Step 3: Notify All Team Members

After cleaning git history, all team members must:

1. **Delete their local clone**:
   ```bash
   rm -rf /path/to/smartboard-fyp
   ```

2. **Clone the repository fresh**:
   ```bash
   git clone git@github.com:Azieltan/smartboard-fyp.git
   cd smartboard-fyp
   ```

3. **Set up their local .env file**:
   ```bash
   cd apps/backend
   cp .env.example .env
   # Then securely obtain and fill in the NEW credentials
   ```

### Step 4: Verify the Cleanup

1. **Check that the file is gone from history**:
   ```bash
   git log --all --full-history -- apps/backend/.env
   # Should return nothing
   ```

2. **Search for any remaining secrets**:
   ```bash
   git log --all -p | grep -i "sb_secret_"
   # Should return nothing (or only redacted references in documentation)
   ```

3. **Verify file size reduction**:
   ```bash
   git count-objects -vH
   # Should show smaller repository size
   ```

### Step 5: Prevent Future Incidents

1. **Enable pre-commit hooks**:
   ```bash
   # Install git-secrets
   brew install git-secrets  # or equivalent for your OS
   
   # Set up git-secrets
   cd /path/to/smartboard-fyp
   git secrets --install
   git secrets --register-aws
   git secrets --add 'sb_[a-z_]+_[A-Za-z0-9]+'
   git secrets --add 'SUPABASE_(SERVICE_KEY|ANON_KEY)'
   ```

2. **Add GitHub Secret Scanning** (if available):
   - Go to repository Settings > Code security and analysis
   - Enable "Secret scanning"
   - Enable "Push protection"

3. **Use a .env.example file**:
   - Keep `.env.example` in the repository with placeholder values
   - Never commit the actual `.env` file
   - Document this in the README

4. **Regular audits**:
   ```bash
   # Run periodically to check for secrets
   git secrets --scan-history
   ```

## Common Pitfalls

❌ **Don't do this**:
- Don't just delete the file and commit - secrets remain in history
- Don't think `.gitignore` retroactively removes files from history
- Don't forget to rotate credentials before cleaning history
- Don't forget to notify team members to re-clone

✅ **Do this**:
- Rotate all credentials immediately
- Clean git history using one of the methods above
- Force push to update the remote repository
- Have all team members re-clone the repository
- Set up prevention measures

## Alternative: Start Fresh (Nuclear Option)

If the repository is new and doesn't have much history, consider:

1. Create a new repository
2. Copy the code (without `.git` directory)
3. Initialize fresh git repository
4. Set up `.gitignore` properly
5. Commit the clean code
6. Archive or delete the old repository

## Resources

- [GitHub: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [git-secrets](https://github.com/awslabs/git-secrets)

## Questions?

If you need help with any of these steps, please contact your team lead or DevOps engineer. Do not ignore this issue - exposed secrets are a critical security vulnerability.

---

**Remember**: The most important step is rotating the credentials BEFORE cleaning git history!
