import { supabase } from '../config/supabase';
import { Testimonial } from '../types/testimonial';

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from('testimonials_view')
    .select('*');

  if (error) {
    throw new Error(`Failed to fetch testimonials: ${error.message}`);
  }

  return data || [];
}