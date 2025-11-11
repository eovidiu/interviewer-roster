# Excel Import Script

This script imports interviewer data from an Excel file into the SQLite database.

## Prerequisites

- Database must exist (run migrations first if needed)
- Excel file must have the correct column structure

## Expected Excel Format

The Excel file should contain the following columns (in any order):

### Required Columns
- `name` - Interviewer's full name
- `email` - Interviewer's email address (must be unique)

### Optional Core Columns
- `role` - Role (admin/talent/viewer) - defaults to 'viewer'
- `skills` - Comma-separated list of skills
- `is_active` - Boolean (true/false or 1/0) - defaults to true
- `timezone` - Timezone string (e.g., "America/Los_Angeles")

### Optional Migration 003 Columns

**Organization & Management:**
- `org` - Team/Organization name
- `manager` - Manager's name
- `check_manager` - Boolean - requires manager approval
- `date_in` - Start date (ISO format: YYYY-MM-DD)

**Interview Profiles (Boolean flags):**
- `profile_backend` - Can conduct backend interviews
- `profile_frontend` - Can conduct frontend interviews
- `profile_fullstack` - Can conduct fullstack interviews
- `profile_sre` - Can conduct SRE interviews
- `profile_big_data` - Can conduct big data interviews
- `profile_cse` - Can conduct CSE interviews
- `profile_ml` - Can conduct ML interviews
- `profile_em` - Can conduct Engineering Manager interviews

**Level & Experience:**
- `max_level` - Maximum interview level (integer)
- `check_level` - Level check notes

**Availability & Status:**
- `pause_until` - Date when pause ends (ISO format: YYYY-MM-DD)
- `is_shadowing` - Boolean - currently in shadowing mode
- `onboarding_completed` - Boolean - onboarding status
- `is_remote` - Boolean - remote interviewer flag

## Usage

### Method 1: Using npm script

```bash
npm run db:import <path-to-excel-file>
```

Example:
```bash
npm run db:import ./TheInterviewTeam.xlsx
```

### Method 2: Direct node execution

```bash
node scripts/import-from-excel.js <path-to-excel-file>
```

Example:
```bash
node scripts/import-from-excel.js ./TheInterviewTeam.xlsx
```

## Behavior

1. **Duplicate Detection**: The script checks for existing emails and skips rows where the email already exists
2. **Validation**: Rows without name or email are skipped
3. **Default Values**:
   - Missing `role` defaults to 'viewer'
   - Missing `is_active` defaults to true
   - All boolean fields default to false/0
4. **Skills Parsing**: Handles both comma-separated strings and arrays
5. **Timestamps**: Automatically sets created_at and updated_at to current time
6. **Created By**: Sets created_by to 'excel-import' for audit tracking

## Output

The script provides detailed output:
- ✅ Successfully imported records
- ⚠️  Skipped records (duplicates or missing required fields)
- ❌ Error records
- 📊 Summary with counts

## Example Excel Structure

| name | email | role | skills | is_active | org | profile_backend | profile_frontend | max_level | onboarding_completed |
|------|-------|------|--------|-----------|-----|-----------------|------------------|-----------|---------------------|
| John Doe | john@example.com | talent | JavaScript,React,Node.js | true | TeamA | true | true | 50 | true |
| Jane Smith | jane@example.com | admin | Python,Django | true | TeamB | true | false | 60 | true |

## Troubleshooting

### Error: Excel file not found
- Check that the file path is correct
- Use absolute path or path relative to project root

### Error: Database not found
- Run migrations first: `npm run db:migrate`

### Records skipped due to duplicate email
- This is normal behavior - the script won't overwrite existing records
- If you need to update existing records, delete them first or use the update API

### Boolean fields not importing correctly
- Ensure boolean values are: `true`, `false`, `1`, `0`, `TRUE`, `FALSE`
- Excel checkboxes export as TRUE/FALSE
