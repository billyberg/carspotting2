export type Profile = {
  id: string;
  user_id: string | null;
  display_name: string;
  is_fake: boolean;
  managed_by: string | null;
  created_at: string;
};

export type Find = {
  id: string;
  profile_id: string;
  plate_number: number;
  found_at: string;
};

export type LeaderboardRow = {
  id: string;
  display_name: string;
  highest_plate: number;
  total_finds: number;
  last_find_at: string | null;
};
