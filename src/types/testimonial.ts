import { User } from './user';

export interface Testimonial {
  name: string;
  image_url: string | null;
  career_stage: string | null;
  logo_url: string | null;
  content: string;
}