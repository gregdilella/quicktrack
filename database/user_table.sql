-- =============================================
-- User Table with Row Level Security Setup
-- =============================================

-- 1. Create the role enum type
CREATE TYPE user_role AS ENUM (
    'Admin',
    'LSP', 
    'Management',
    'Operations',
    'Customer'
);

-- 2. Create the user_table in public schema
CREATE TABLE public.user_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'Customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per auth user
    CONSTRAINT unique_user_id UNIQUE (user_id),
    -- Ensure email format is valid
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 3. Enable Row Level Security
ALTER TABLE public.user_table ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Policy: Users can view their own record
CREATE POLICY "Users can view own profile" 
ON public.user_table 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can update their own record (except role - only admins can change roles)
CREATE POLICY "Users can update own profile" 
ON public.user_table 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Admins can view all records
CREATE POLICY "Admins can view all profiles" 
ON public.user_table 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_table 
        WHERE user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Policy: Admins can update all records
CREATE POLICY "Admins can update all profiles" 
ON public.user_table 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_table 
        WHERE user_id = auth.uid() 
        AND role = 'Admin'
    )
);

-- Policy: Allow inserts for authenticated users (for registration)
CREATE POLICY "Allow profile creation" 
ON public.user_table 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Create function to automatically create user_table record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_table (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'Customer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to automatically create user_table record
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER handle_user_table_updated_at
    BEFORE UPDATE ON public.user_table
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. Create indexes for better performance
CREATE INDEX idx_user_table_user_id ON public.user_table(user_id);
CREATE INDEX idx_user_table_email ON public.user_table(email);
CREATE INDEX idx_user_table_role ON public.user_table(role); 