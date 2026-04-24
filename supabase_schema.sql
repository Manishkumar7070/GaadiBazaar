-- Users profile table (links to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role text check (role in ('buyer', 'seller', 'dealer', 'admin')) default 'buyer',
  is_profile_complete boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Shops/Dealers table
create table public.shops (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  name text not null,
  description text,
  address text,
  city text,
  state text,
  phone text,
  images text[] default '{}',
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Vehicles table
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references auth.users not null,
  shop_id uuid references public.shops,
  title text not null,
  description text,
  price numeric not null,
  brand text,
  model text,
  year integer,
  vehicle_type text,
  fuel_type text,
  transmission text,
  kilometers_driven integer,
  ownership text,
  registration_number text,
  mileage text,
  color text,
  assembly_type text,
  city text,
  state text,
  images text[] default '{}',
  status text check (status in ('active', 'sold', 'pending', 'inactive')) default 'active',
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) default 'pending',
  is_featured boolean default false,
  views_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Wishlist table
create table public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  vehicle_id uuid references public.vehicles on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, vehicle_id)
);

-- Storage Buckets Configuration
-- Note: These might need to be created via the Supabase Dashboard if the database owner doesn't have permissions for storage schema
insert into storage.buckets (id, name, public) 
values ('shops', 'shops', true), ('vehicles', 'vehicles', true)
on conflict (id) do nothing;

create policy "Public Access" on storage.objects for select using ( bucket_id in ('shops', 'vehicles') );
create policy "Authenticated Upload" on storage.objects for insert with check ( bucket_id in ('shops', 'vehicles') and auth.role() = 'authenticated' );

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.vehicles enable row level security;
alter table public.wishlists enable row level security;

-- Public read access
create policy "Public vehicles access" on public.vehicles for select using (true);
create policy "Public shops access" on public.shops for select using (true);

-- Auth user access for wishlists
create policy "Users can manage own wishlist" on public.wishlists
  for all using (auth.uid() = user_id);

-- Profile policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Handle profile creation on signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'buyer'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
