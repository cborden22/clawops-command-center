
## Email Notifications & Subuser Management Implementation

This plan covers two major feature additions:
1. **Email notifications** when maintenance requests are submitted
2. **Subuser system** with role-based permissions and task assignment

---

## Feature 1: Maintenance Report Email Notifications

### Overview
When a customer submits a maintenance report via QR code, the machine owner will receive an email notification with the report details.

### Technical Approach

#### Email Service Setup
Since Lovable Cloud doesn't have a RESEND_API_KEY configured yet, we'll need to set one up. You'll need to:
1. Create an account at https://resend.com
2. Verify your email domain at https://resend.com/domains
3. Create an API key at https://resend.com/api-keys

#### Database Changes
Add a column to the profiles table to store notification preferences:

```sql
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled boolean DEFAULT true;
```

#### Edge Function Updates
Modify the existing `submit-maintenance-report` edge function to:
1. After successfully inserting the report, fetch the owner's email from profiles
2. Send an email notification via Resend

#### Email Content
The notification email will include:
- Machine name and location
- Issue type and severity
- Description of the problem
- Reporter contact info (if provided)
- Link to the Maintenance page in ClawOps

---

## Feature 2: Subuser Management System

### Overview
Allow the primary account owner to invite and manage subusers (team members) with configurable permissions. Subusers can be assigned tasks and maintenance reports, and the owner can control what data each subuser can access.

### Database Schema

#### 1. Team Roles Enum
```sql
CREATE TYPE public.team_role AS ENUM ('owner', 'manager', 'technician');
```

#### 2. Team Members Table
```sql
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'technician',
  status text NOT NULL DEFAULT 'pending', -- pending, active, deactivated
  invited_email text NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(owner_user_id, member_user_id)
);
```

#### 3. Team Member Permissions Table
Control what each team member can see/do:
```sql
CREATE TABLE public.team_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  can_view_revenue boolean DEFAULT false,
  can_view_inventory boolean DEFAULT true,
  can_view_locations boolean DEFAULT true,
  can_view_maintenance boolean DEFAULT true,
  can_manage_maintenance boolean DEFAULT true,
  can_view_leads boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  can_view_documents boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

#### 4. Task Assignments Table
For assigning maintenance reports or custom tasks to team members:
```sql
CREATE TABLE public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  maintenance_report_id uuid REFERENCES public.maintenance_reports(id) ON DELETE CASCADE,
  title text,
  description text,
  priority text DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);
```

#### 5. Security Definer Function for Role Checking
```sql
CREATE OR REPLACE FUNCTION public.get_team_role(checking_user_id uuid, owner_id uuid)
RETURNS team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.team_members
  WHERE member_user_id = checking_user_id
    AND owner_user_id = owner_id
    AND status = 'active'
  LIMIT 1
$$;
```

### Frontend Components

#### 1. Team Management Page
New tab in Settings or standalone page accessible from sidebar:
- **Invite Team Member**: Enter email, select role, configure permissions
- **Team Member List**: View all invited/active members with status
- **Edit Permissions**: Modal to adjust what each member can access
- **Remove Member**: Deactivate or remove team members

#### 2. Task Assignment UI
In the Maintenance page:
- **Assign Button** on each report card
- **Assignment Dialog**: Select team member, add notes, set due date
- **My Assignments View**: For subusers to see tasks assigned to them

#### 3. Subuser Dashboard
When a subuser logs in:
- They see a filtered view based on their permissions
- Navigation hides sections they can't access
- "My Tasks" widget shows assigned maintenance reports

### Invite Flow
1. Owner enters email in Team Management
2. System creates team_members record with status='pending'
3. Email sent with invite link (edge function via Resend)
4. Recipient creates account or logs in
5. Upon matching email, status updates to 'active'

### RLS Policy Updates
All existing tables need additional RLS policies to allow team members access:

```sql
-- Example: Allow team members to view locations
CREATE POLICY "Team members can view owner locations"
ON public.locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    INNER JOIN public.team_member_permissions p ON p.team_member_id = tm.id
    WHERE tm.member_user_id = auth.uid()
      AND tm.owner_user_id = locations.user_id
      AND tm.status = 'active'
      AND p.can_view_locations = true
  )
);
```

---

## Implementation Phases

### Phase 1: Email Notifications
| File | Changes |
|------|---------|
| New Secret: RESEND_API_KEY | Email service authentication |
| `supabase/functions/submit-maintenance-report/index.ts` | Add email sending after report creation |
| `profiles` table migration | Add `email_notifications_enabled` column |
| `src/pages/Settings.tsx` | Add notification preferences toggle |

### Phase 2: Subuser Database Schema
| Migration | Description |
|-----------|-------------|
| Create team_role enum | Define role types |
| Create team_members table | Store team relationships |
| Create team_member_permissions table | Granular access control |
| Create task_assignments table | Task/report assignment |
| Create get_team_role function | Security definer for role checks |
| Update RLS policies | Allow team member access |

### Phase 3: Team Management UI
| File | Changes |
|------|---------|
| `src/pages/Team.tsx` | New page for team management |
| `src/components/team/InviteMemberDialog.tsx` | Invite modal |
| `src/components/team/MemberPermissionsDialog.tsx` | Permissions editor |
| `src/components/team/TeamMemberCard.tsx` | Display member info |
| `src/hooks/useTeamMembers.ts` | Data fetching hook |
| `supabase/functions/send-team-invite/index.ts` | Email invite edge function |
| Update `AppSidebar.tsx` | Add Team nav item |

### Phase 4: Task Assignment & Subuser Experience
| File | Changes |
|------|---------|
| `src/hooks/useTaskAssignments.ts` | Task management hook |
| `src/components/maintenance/AssignReportDialog.tsx` | Assignment UI |
| `src/pages/Maintenance.tsx` | Add assign button to report cards |
| `src/components/dashboard/MyTasksWidget.tsx` | Subuser task list |
| Update navigation logic | Hide sections based on permissions |

---

## Before Proceeding

I need to set up the email service first. Do you have a Resend account? If not:

1. Go to https://resend.com and create a free account
2. Verify your email domain at https://resend.com/domains  
3. Create an API key at https://resend.com/api-keys

Once you have the API key ready, let me know and I'll request it to add as a secret, then begin implementation.
