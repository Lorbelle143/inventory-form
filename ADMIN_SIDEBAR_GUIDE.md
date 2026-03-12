# Admin Dashboard Sidebar Implementation Guide

## Current Status
- ✅ Student Dashboard has sidebar navigation
- ⏳ Admin Dashboard needs sidebar (currently has top navigation)

## What Needs to Be Done

### 1. Layout Structure Change
Change from:
```jsx
<div className="min-h-screen">
  <nav> Top Header </nav>
  <div> Content </div>
</div>
```

To:
```jsx
<div className="flex h-screen">
  <aside> Left Sidebar </aside>
  <div className="flex-1">
    <header> Top Header </header>
    <main> Content </main>
  </div>
</div>
```

### 2. Sidebar Menu Items
- Dashboard (submissions view)
- Students
- Mental Health
- Analytics
- User Management
- Sign Out (at bottom)

### 3. Color Theme
- Use orange/red gradient (admin colors)
- Active menu: `bg-orange-600 text-white`
- Hover: `hover:bg-gray-100`

### 4. Top Header
- Show current view title
- Notification bell
- Admin avatar (orange/red)

## Quick Implementation

Since the AdminDashboard.tsx file is very large and complex, here are two options:

### Option A: Manual Implementation
1. Open `src/pages/AdminDashboard.tsx`
2. Find the `return (` statement (around line 570)
3. Replace the entire return block with the sidebar layout
4. Keep all the existing functions and state

### Option B: Copy from Student Dashboard
1. Copy the sidebar structure from `src/pages/StudentDashboard.tsx` (lines 135-200)
2. Change colors from blue to orange/red
3. Update menu items for admin
4. Paste into AdminDashboard

## Code Snippet for Sidebar

```tsx
<aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
  {/* Logo */}
  <div className="h-20 flex items-center justify-center border-b border-gray-200 px-4">
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">A</span>
      </div>
      <div>
        <h1 className="font-bold text-gray-800 text-sm">NBSC Admin</h1>
        <p className="text-xs text-gray-500">Control Panel</p>
      </div>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 py-6 px-3 space-y-1">
    <button
      onClick={() => setViewMode('submissions')}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        viewMode === 'submissions' 
          ? 'bg-orange-600 text-white' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span className="font-medium">Dashboard</span>
    </button>
    
    {/* Add more menu items... */}
  </nav>

  {/* Sign Out */}
  <button
    onClick={handleSignOut}
    className="m-3 flex items-center justify-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition border border-red-200"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
    Sign Out
  </button>
</aside>
```

## Notes
- The AdminDashboard.tsx file is ~1500 lines
- Too complex for automated string replacement
- Recommend manual implementation or creating new file
- All existing functionality should be preserved

---

**Recommendation**: Manually add the sidebar by copying the structure from StudentDashboard and adapting it for admin use.
