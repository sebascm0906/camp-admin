export type Membership = {
  id: string;
  camp_id: string;
  role: string;
  status: string;
};

export type AuthenticatedUser = {
  id: string;
  firebase_uid: string;
  email: string;
  role: string | null;
  camp_id: string | null;
  is_active: boolean;
  effective_membership_id?: string | null;
  effective_camp_id?: string | null;
  memberships: Membership[];
};

export type AuthStatusResponse = {
  state: "UNINVITED" | "INVITED" | "MEMBER" | "BOOTSTRAP_ELIGIBLE";
};
