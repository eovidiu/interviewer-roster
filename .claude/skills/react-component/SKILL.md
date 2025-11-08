---
name: react-component
description: Use when creating new React components, shadcn/ui integrations, or Tailwind-styled UI elements. Follows project conventions for component structure and styling.
---

## Component Conventions

**Shared Components:** Place in `src/components/`
**Page Components:** Place in `src/polymet/pages/`
**Styling:** Use Tailwind classes + shadcn/ui primitives

## Tech Stack

- **React 19** with hooks (useState, useEffect, useContext, etc.)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui components** (@radix-ui primitives)
- **lucide-react** for icons
- **class-variance-authority** for component variants
- **react-router-dom v7** for navigation

## Component Template

```tsx
import { cn } from "@/lib/utils";

interface MyComponentProps {
  className?: string;
  children?: React.ReactNode;
  // other props
}

export function MyComponent({
  className,
  children,
  ...props
}: MyComponentProps) {
  return (
    <div className={cn("base-classes", className)} {...props}>
      {children}
    </div>
  );
}
```

## Available shadcn/ui Components

The project includes these shadcn/ui components:

- **AlertDialog** - Modal confirmations
- **Dialog** - Modal dialogs
- **DropdownMenu** - Dropdown menus
- **Label** - Form labels
- **RadioGroup** - Radio button groups
- **Select** - Select dropdowns
- **Switch** - Toggle switches
- **Tooltip** - Hover tooltips
- **Button** - Buttons (via Slot)

## Styling Guidelines

**Tailwind Utilities:**

```tsx
// Layout
<div className="flex items-center justify-between gap-4">

// Spacing
<div className="p-4 mb-6">  {/* padding, margin */}

// Colors (project uses primary/secondary/accent)
<div className="bg-primary text-primary-foreground">

// Typography
<h1 className="text-2xl font-bold">
<p className="text-sm text-muted-foreground">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Using cn() for Conditional Classes:**

```tsx
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "variant-class",
  className
)}>
```

## Routing & Navigation

```tsx
import { Link, useNavigate } from 'react-router-dom';

// Link component
<Link to="/interviewers" className="...">
  Interviewers
</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/dashboard');
```

## Role-Based Components

The app uses role-based access (viewer, talent, admin):

```tsx
import { useAuth } from '@/polymet/data/auth-context';

export function AdminOnlyComponent() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return null;
  }

  return <div>Admin content</div>;
}
```

## Icons

Use lucide-react for all icons:

```tsx
import { UserCircle, Calendar, Settings } from 'lucide-react';

<UserCircle className="h-4 w-4" />
<Calendar className="h-5 w-5 text-muted-foreground" />
```

## State Management

- **Local state:** `useState` for component-specific state
- **Global state:** Context API (see `src/polymet/data/auth-context.tsx`)
- **Form state:** Controlled components with useState

## Data Fetching

```tsx
import { useEffect, useState } from 'react';

export function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

## Testing New Components

Always add tests for new components in `src/test/`:

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected')).toBeInTheDocument();
});
```

## Component Checklist

When creating new components:

- [ ] Add TypeScript interface for props
- [ ] Use semantic HTML elements
- [ ] Apply Tailwind classes for styling
- [ ] Accept `className` prop for customization
- [ ] Use `cn()` utility for class merging
- [ ] Add appropriate ARIA attributes for accessibility
- [ ] Export component from file
- [ ] Add tests in `src/test/`
- [ ] Follow naming conventions (PascalCase for components)
