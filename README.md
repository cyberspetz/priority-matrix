# Priority Matrix - Eisenhower Matrix Task Manager

A web application that helps you organize tasks using the Eisenhower Matrix (also known as the Eisenhower Decision Matrix), which categorizes tasks based on urgency and importance.

Inspired by productivity tools like [Appfluence](https://appfluence.com/), this application provides a clean, modern interface for task prioritization using the proven Eisenhower method.

![Priority Matrix Screenshot](https://via.placeholder.com/1200x800/f8fafc/1f2937?text=Priority+Matrix+-+Modern+Eisenhower+Task+Manager)

## Features

✅ **Four-Quadrant Matrix**: Organize tasks into Urgent/Important, Not Urgent/Important, Urgent/Not Important, and Not Urgent/Not Important
✅ **Drag & Drop**: Seamlessly move tasks between quadrants
✅ **Persistent Storage**: Tasks are saved to a Supabase database
✅ **Responsive Design**: Works on desktop and mobile devices
✅ **Real-time Updates**: Changes are immediately reflected in the database
✅ **Modern UI**: Clean, professional interface built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (React), TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **UI Components**: Headless UI

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd priority-matrix-clone
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up the database:**

In your Supabase SQL editor, run:
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quadrant VARCHAR(50) NOT NULL CHECK (quadrant IN (
    'urgent-important',
    'not-urgent-important',
    'urgent-not-important',
    'not-urgent-not-important'
  )),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## How to Use

1. **Add a Task**: Click "Add New Task" and enter a task title
2. **Move Tasks**: Drag and drop tasks between the four quadrants
3. **Delete Tasks**: Click the 'X' button on any task card to delete it
4. **Organize by Priority**:
   - **Urgent & Important** (Do): Critical tasks that need immediate attention
   - **Not Urgent & Important** (Schedule): Important tasks to plan for
   - **Urgent & Not Important** (Delegate): Tasks that are pressing but not critical
   - **Not Urgent & Not Important** (Eliminate): Low-priority tasks to minimize

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Main application page
├── components/
│   ├── AddTaskModal.tsx  # Modal for adding new tasks
│   ├── Quadrant.tsx      # Individual quadrant component
│   └── TaskCard.tsx      # Individual task card component
└── lib/
    └── supabaseClient.ts # Supabase configuration and API functions
```

## API Functions

The application includes the following database operations:

- `getAllTasks()` - Fetch all tasks from database
- `createTask(title, quadrant, description?)` - Create a new task
- `updateTask(id, updates)` - Update an existing task
- `deleteTask(id)` - Delete a task

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel with Supabase.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- **Design Inspiration**: [Appfluence](https://appfluence.com/) - A beautiful productivity platform that inspired the modern, clean UI design
- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Drag and drop by [dnd kit](https://dndkit.com/)
- UI components from [Headless UI](https://headlessui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
