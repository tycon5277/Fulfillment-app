// =============================================================================
// COMPREHENSIVE SKILL-BASED MOCK DATA SYSTEM
// Maps all skills to categories and provides mock data for each
// =============================================================================

// COMPLETE LIST OF ALL SKILLS WITH CATEGORY MAPPINGS
// Each skill ID is mapped to a category ID that has corresponding mock data
export const SKILL_TO_CATEGORY: { [skillId: string]: string } = {
  // HOME SERVICES → home_services
  deep_cleaning: 'home_services',
  regular_cleaning: 'home_services',
  kitchen_cleaning: 'home_services',
  bathroom_cleaning: 'home_services',
  carpet_cleaning: 'home_services',
  sofa_cleaning: 'home_services',
  laundry: 'home_services',
  dishwashing: 'home_services',
  window_cleaning: 'home_services',
  organizing: 'home_services',
  mattress_cleaning: 'home_services',
  chimney_cleaning: 'home_services',

  // REPAIR & MAINTENANCE → repair_maintenance
  plumbing: 'repair_maintenance',
  electrical: 'repair_maintenance',
  carpentry: 'repair_maintenance',
  painting: 'repair_maintenance',
  ac_repair: 'repair_maintenance',
  refrigerator: 'repair_maintenance',
  washing_machine: 'repair_maintenance',
  tv_repair: 'repair_maintenance',
  microwave: 'repair_maintenance',
  geyser: 'repair_maintenance',
  fan_repair: 'repair_maintenance',
  inverter: 'repair_maintenance',
  furniture_assembly: 'repair_maintenance',
  door_lock: 'repair_maintenance',
  waterproofing: 'repair_maintenance',

  // DRIVER ON DEMAND → driver_services
  personal_driver: 'driver_services',
  outstation_driver: 'driver_services',
  corporate_driver: 'driver_services',
  airport_transfer: 'driver_services',
  night_driver: 'driver_services',
  wedding_driver: 'driver_services',
  vip_driver: 'driver_services',
  female_driver: 'driver_services',
  elderly_driver: 'driver_services',
  medical_transport: 'driver_services',

  // LUXURY CAR & VEHICLE HIRE → luxury_hire
  wedding_car: 'luxury_hire',
  luxury_sedan: 'luxury_hire',
  vintage_car: 'luxury_hire',
  limousine: 'luxury_hire',
  sports_car: 'luxury_hire',
  suv_hire: 'luxury_hire',
  party_bus: 'luxury_hire',
  convertible: 'luxury_hire',
  rolls_royce: 'luxury_hire',
  photoshoot_car: 'luxury_hire',

  // COMMERCIAL VEHICLES → commercial_vehicles
  truck_driver: 'commercial_vehicles',
  tempo_driver: 'commercial_vehicles',
  container_driver: 'commercial_vehicles',
  tanker_driver: 'commercial_vehicles',
  bus_driver: 'commercial_vehicles',
  school_bus: 'commercial_vehicles',
  tractor_driver: 'commercial_vehicles',
  crane_operator: 'commercial_vehicles',
  forklift: 'commercial_vehicles',
  jcb_operator: 'commercial_vehicles',

  // PHOTOGRAPHY & VIDEOGRAPHY → photography_video
  wedding_photography: 'photography_video',
  portrait_photo: 'photography_video',
  event_photography: 'photography_video',
  product_photography: 'photography_video',
  fashion_photography: 'photography_video',
  food_photography: 'photography_video',
  real_estate_photo: 'photography_video',
  wedding_video: 'photography_video',
  corporate_video: 'photography_video',
  music_video: 'photography_video',
  documentary: 'photography_video',
  live_streaming: 'photography_video',
  video_editing: 'photography_video',
  photo_editing: 'photography_video',

  // DRONE SERVICES → drone_services
  drone_photography: 'drone_services',
  drone_videography: 'drone_services',
  drone_wedding: 'drone_services',
  drone_survey: 'drone_services',
  drone_inspection: 'drone_services',
  drone_events: 'drone_services',
  drone_real_estate: 'drone_services',
  fpv_drone: 'drone_services',
  drone_agriculture: 'drone_services',
  drone_delivery: 'drone_services',

  // VEHICLE SERVICES → vehicle_services
  car_wash: 'vehicle_services',
  car_detailing: 'vehicle_services',
  bike_wash: 'vehicle_services',
  car_service: 'vehicle_services',
  bike_repair: 'vehicle_services',
  puncture: 'vehicle_services',
  battery_service: 'vehicle_services',
  denting_painting: 'vehicle_services',
  car_polish: 'vehicle_services',
  ac_service_car: 'vehicle_services',

  // TECH SERVICES → tech_services
  computer_repair: 'tech_services',
  phone_repair: 'tech_services',
  tablet_repair: 'tech_services',
  data_recovery: 'tech_services',
  virus_removal: 'tech_services',
  software_install: 'tech_services',
  networking: 'tech_services',
  smart_home: 'tech_services',
  cctv: 'tech_services',
  printer: 'tech_services',
  gaming_setup: 'tech_services',
  website: 'tech_services',

  // GARDEN & OUTDOOR → garden_outdoor
  gardening: 'garden_outdoor',
  lawn_mowing: 'garden_outdoor',
  tree_trimming: 'garden_outdoor',
  landscaping: 'garden_outdoor',
  pest_control: 'garden_outdoor',
  termite: 'garden_outdoor',
  tank_cleaning: 'garden_outdoor',
  solar_cleaning: 'garden_outdoor',
  terrace_garden: 'garden_outdoor',
  irrigation: 'garden_outdoor',

  // WELLNESS & BEAUTY → wellness_beauty
  massage: 'wellness_beauty',
  spa_home: 'wellness_beauty',
  haircut_men: 'wellness_beauty',
  haircut_women: 'wellness_beauty',
  facial: 'wellness_beauty',
  makeup: 'wellness_beauty',
  mehendi: 'wellness_beauty',
  manicure: 'wellness_beauty',
  waxing: 'wellness_beauty',
  yoga: 'wellness_beauty',
  personal_trainer: 'wellness_beauty',
  physiotherapy: 'wellness_beauty',
  dietician: 'wellness_beauty',

  // PET SERVICES → pet_services
  pet_grooming: 'pet_services',
  dog_walking: 'pet_services',
  pet_sitting: 'pet_services',
  pet_boarding: 'pet_services',
  pet_training: 'pet_services',
  vet_visit: 'pet_services',
  aquarium: 'pet_services',
  bird_care: 'pet_services',

  // EDUCATION & TUTORING → education
  math_tutor: 'education',
  science_tutor: 'education',
  english_tutor: 'education',
  hindi_tutor: 'education',
  coding_tutor: 'education',
  music_lessons: 'education',
  art_lessons: 'education',
  dance_lessons: 'education',
  foreign_lang: 'education',
  exam_prep: 'education',
  nursery_teach: 'education',
  special_needs: 'education',

  // EVENTS & ENTERTAINMENT → events_entertainment
  dj: 'events_entertainment',
  event_decor: 'events_entertainment',
  balloon_decor: 'events_entertainment',
  flower_decor: 'events_entertainment',
  catering: 'events_entertainment',
  anchor: 'events_entertainment',
  magic_show: 'events_entertainment',
  clown: 'events_entertainment',
  live_music: 'events_entertainment',
  standup: 'events_entertainment',
  game_host: 'events_entertainment',
  puppet_show: 'events_entertainment',

  // CULINARY SERVICES → culinary
  home_cook: 'culinary',
  party_cook: 'culinary',
  baking: 'culinary',
  tiffin: 'culinary',
  bbq: 'culinary',
  bartending: 'culinary',
  diet_meal: 'culinary',
  ethnic_cuisine: 'culinary',

  // SHIFTING & LOGISTICS → shifting
  packers_movers: 'shifting',
  furniture_moving: 'shifting',
  office_shifting: 'shifting',
  loading_unloading: 'shifting',
  courier_service: 'shifting',
  storage: 'shifting',
  junk_removal: 'shifting',

  // SPECIAL & UNIQUE SERVICES → special_services
  astrology: 'special_services',
  vastu: 'special_services',
  tarot: 'special_services',
  numerology: 'special_services',
  pandit: 'special_services',
  wedding_priest: 'special_services',
  interior_consult: 'special_services',
  feng_shui: 'special_services',
  handwriting: 'special_services',
  restoration: 'special_services',
};

// =============================================================================
// MOCK APPOINTMENTS BY CATEGORY
// =============================================================================
export const MOCK_APPOINTMENTS: { [categoryId: string]: any[] } = {
  home_services: [
    { id: 'hs1', service: 'Deep House Cleaning', customer: 'Priya Patel', time: '10:00 AM', duration: '3 hours', location: 'DLF Phase 3', status: 'completed', earnings: 2500 },
    { id: 'hs2', service: 'Kitchen Cleaning', customer: 'Rahul Sharma', time: '2:00 PM', duration: '2 hours', location: 'Sector 21', status: 'in_progress', earnings: 1200 },
    { id: 'hs3', service: 'Sofa & Carpet Clean', customer: 'Neha Gupta', time: '5:30 PM', duration: '1.5 hours', location: 'Golf Course Road', status: 'upcoming', earnings: 800 },
  ],
  repair_maintenance: [
    { id: 'rm1', service: 'AC Repair & Service', customer: 'Vikram Singh', time: '9:00 AM', duration: '2 hours', location: 'Sector 45', status: 'completed', earnings: 1800 },
    { id: 'rm2', service: 'Plumbing Work', customer: 'Amit Kumar', time: '1:00 PM', duration: '1.5 hours', location: 'MG Road', status: 'in_progress', earnings: 900 },
    { id: 'rm3', service: 'Electrical Wiring', customer: 'Sanjay Gupta', time: '4:00 PM', duration: '3 hours', location: 'DLF Cyber Hub', status: 'upcoming', earnings: 2200 },
  ],
  driver_services: [
    { id: 'ds1', service: 'Airport Transfer', customer: 'Kavita Joshi', time: '4:00 AM', duration: '1.5 hours', location: 'Sector 44 → IGI T3', status: 'completed', earnings: 1200 },
    { id: 'ds2', service: 'Corporate Chauffeur', customer: 'Mr. Malhotra', time: '9:00 AM', duration: '8 hours', location: 'Multiple Locations', status: 'in_progress', earnings: 2500 },
    { id: 'ds3', service: 'Wedding Car Service', customer: 'Kapoor Family', time: '5:00 PM', duration: '6 hours', location: 'Chattarpur', status: 'upcoming', earnings: 4000 },
  ],
  luxury_hire: [
    { id: 'lh1', service: 'Wedding Rolls Royce', customer: 'Sharma Wedding', time: '8:00 AM', duration: '10 hours', location: 'South Delhi', status: 'completed', earnings: 45000 },
    { id: 'lh2', service: 'Vintage Car Photoshoot', customer: 'Fashion Magazine', time: '2:00 PM', duration: '4 hours', location: 'Connaught Place', status: 'upcoming', earnings: 15000 },
  ],
  commercial_vehicles: [
    { id: 'cv1', service: 'Goods Transport', customer: 'ABC Traders', time: '6:00 AM', duration: '8 hours', location: 'Delhi → Jaipur', status: 'completed', earnings: 8000 },
    { id: 'cv2', service: 'Container Loading', customer: 'Export Co.', time: '10:00 AM', duration: '5 hours', location: 'Tughlakabad', status: 'upcoming', earnings: 5000 },
  ],
  photography_video: [
    { id: 'pv1', service: 'Wedding Photography', customer: 'Sharma Family', time: '7:00 AM', duration: '10 hours', location: 'ITC Grand', status: 'completed', earnings: 35000 },
    { id: 'pv2', service: 'Product Photoshoot', customer: 'FashionBrand Inc', time: '11:00 AM', duration: '4 hours', location: 'Studio 14', status: 'in_progress', earnings: 12000 },
    { id: 'pv3', service: 'Birthday Party Photos', customer: 'Verma Family', time: '4:00 PM', duration: '3 hours', location: 'Sector 50', status: 'upcoming', earnings: 8000 },
  ],
  drone_services: [
    { id: 'dr1', service: 'Wedding Aerial Shoot', customer: 'Kapoor Family', time: '8:00 AM', duration: '6 hours', location: 'Farmhouse, Chattarpur', status: 'completed', earnings: 25000 },
    { id: 'dr2', service: 'Real Estate Drone Video', customer: 'DLF Builders', time: '2:00 PM', duration: '3 hours', location: 'New Gurgaon', status: 'in_progress', earnings: 15000 },
    { id: 'dr3', service: 'Event Aerial Coverage', customer: 'TechCorp', time: '5:00 PM', duration: '2 hours', location: 'Cyber Hub', status: 'upcoming', earnings: 12000 },
  ],
  vehicle_services: [
    { id: 'vs1', service: 'Full Car Detailing', customer: 'BMW Owner', time: '9:00 AM', duration: '4 hours', location: 'Sector 29', status: 'completed', earnings: 3500 },
    { id: 'vs2', service: 'Bike Wash & Polish', customer: 'Harley Owner', time: '1:00 PM', duration: '2 hours', location: 'Sector 15', status: 'in_progress', earnings: 1200 },
    { id: 'vs3', service: 'Denting & Painting', customer: 'Honda City', time: '4:00 PM', duration: '2 days', location: 'Auto Hub', status: 'upcoming', earnings: 8000 },
  ],
  tech_services: [
    { id: 'ts1', service: 'Laptop Repair', customer: 'Amit Choudhary', time: '10:00 AM', duration: '2 hours', location: 'Sector 14', status: 'completed', earnings: 2500 },
    { id: 'ts2', service: 'CCTV Installation', customer: 'Home Security', time: '2:00 PM', duration: '4 hours', location: 'Sector 57', status: 'in_progress', earnings: 12000 },
    { id: 'ts3', service: 'Smart Home Setup', customer: 'Tech Enthusiast', time: '5:00 PM', duration: '3 hours', location: 'DLF Phase 5', status: 'upcoming', earnings: 8000 },
  ],
  garden_outdoor: [
    { id: 'go1', service: 'Garden Maintenance', customer: 'Sharma Villa', time: '7:00 AM', duration: '3 hours', location: 'Sector 50', status: 'completed', earnings: 1500 },
    { id: 'go2', service: 'Pest Control', customer: 'Gupta Residence', time: '11:00 AM', duration: '2 hours', location: 'Sector 42', status: 'in_progress', earnings: 2000 },
    { id: 'go3', service: 'Terrace Garden Setup', customer: 'New Apartment', time: '3:00 PM', duration: '5 hours', location: 'DLF Phase 4', status: 'upcoming', earnings: 8000 },
  ],
  wellness_beauty: [
    { id: 'wb1', service: 'Bridal Makeup', customer: 'Priya (Bride)', time: '5:00 AM', duration: '4 hours', location: 'South City', status: 'completed', earnings: 25000 },
    { id: 'wb2', service: 'Hair & Facial', customer: 'Meera Kapoor', time: '2:00 PM', duration: '2 hours', location: 'Sector 42', status: 'in_progress', earnings: 3000 },
    { id: 'wb3', service: 'Yoga Session', customer: 'Group Class', time: '6:00 AM', duration: '1 hour', location: 'DLF Park', status: 'upcoming', earnings: 1500 },
  ],
  pet_services: [
    { id: 'ps1', service: 'Dog Grooming', customer: 'Bruno (Labrador)', time: '10:00 AM', duration: '2 hours', location: 'Sector 50', status: 'completed', earnings: 1800 },
    { id: 'ps2', service: 'Pet Sitting', customer: 'Milo (Cat)', time: '12:00 PM', duration: '3 days', location: 'Sector 47', status: 'in_progress', earnings: 3000 },
    { id: 'ps3', service: 'Dog Training', customer: 'Max (German Shepherd)', time: '7:00 AM', duration: '1 hour', location: 'Sector 31', status: 'upcoming', earnings: 1000 },
  ],
  education: [
    { id: 'ed1', service: 'Math Tutoring', customer: 'Parent - Khanna', time: '4:00 PM', duration: '2 hours', location: 'Sector 15', status: 'completed', earnings: 1200 },
    { id: 'ed2', service: 'Coding Class', customer: 'Young Coder', time: '5:00 PM', duration: '1.5 hours', location: 'Sector 40', status: 'in_progress', earnings: 2500 },
    { id: 'ed3', service: 'Music Lesson', customer: 'Guitar Student', time: '7:00 PM', duration: '1 hour', location: 'DLF Phase 1', status: 'upcoming', earnings: 1000 },
  ],
  events_entertainment: [
    { id: 'ee1', service: 'DJ at Birthday Party', customer: 'Birthday Host', time: '7:00 PM', duration: '4 hours', location: 'Sector 31 Farmhouse', status: 'completed', earnings: 12000 },
    { id: 'ee2', service: 'Event Decoration', customer: 'Baby Shower', time: '10:00 AM', duration: '5 hours', location: 'Golf Course Ext', status: 'in_progress', earnings: 8000 },
    { id: 'ee3', service: 'Magic Show', customer: "Kid's Birthday", time: '4:00 PM', duration: '1.5 hours', location: 'Sector 22', status: 'upcoming', earnings: 5000 },
  ],
  culinary: [
    { id: 'cu1', service: 'Party Cooking', customer: 'Birthday Party (50 guests)', time: '8:00 AM', duration: '8 hours', location: 'Sector 31', status: 'completed', earnings: 15000 },
    { id: 'cu2', service: 'Tiffin Service', customer: 'Office (20 meals)', time: '10:00 AM', duration: '3 hours', location: 'Cyber Hub', status: 'in_progress', earnings: 4000 },
    { id: 'cu3', service: 'BBQ Night', customer: 'House Party', time: '6:00 PM', duration: '4 hours', location: 'Sector 50 Farmhouse', status: 'upcoming', earnings: 8000 },
  ],
  shifting: [
    { id: 'sh1', service: 'Full Home Shifting', customer: 'Kumar Family', time: '6:00 AM', duration: '8 hours', location: 'Noida → Gurgaon', status: 'completed', earnings: 12000 },
    { id: 'sh2', service: 'Office Shifting', customer: 'Startup Co.', time: '9:00 PM', duration: '6 hours', location: 'Connaught Place', status: 'upcoming', earnings: 25000 },
  ],
  special_services: [
    { id: 'ss1', service: 'Puja Ceremony', customer: 'Sharma Family', time: '6:00 AM', duration: '3 hours', location: 'Sector 45', status: 'completed', earnings: 5100 },
    { id: 'ss2', service: 'Vastu Consultation', customer: 'New Home Owner', time: '11:00 AM', duration: '2 hours', location: 'DLF Phase 5', status: 'upcoming', earnings: 3000 },
  ],
};

// =============================================================================
// MOCK CHATS BY CATEGORY
// =============================================================================
export const MOCK_CHATS: { [categoryId: string]: any[] } = {
  home_services: [
    { id: 'c1', customer: 'Amit Kumar', service: 'Deep House Cleaning', lastMessage: 'Great! See you at 2 PM then.', time: '2 min ago', unread: 2, status: 'active', avatar: 'A' },
    { id: 'c2', customer: 'Priya Patel', service: 'Full House Cleaning', lastMessage: 'Can you bring the cleaning supplies?', time: '15 min ago', unread: 1, status: 'active', avatar: 'P' },
    { id: 'c3', customer: 'Sunita Verma', service: 'Kitchen Cleaning', lastMessage: 'Thank you for the great work!', time: '1 hr ago', unread: 0, status: 'completed', avatar: 'S' },
  ],
  repair_maintenance: [
    { id: 'c1', customer: 'Vikram Singh', service: 'AC Repair', lastMessage: 'The AC is cooling much better now!', time: '20 min ago', unread: 0, status: 'completed', avatar: 'V' },
    { id: 'c2', customer: 'Amit Kumar', service: 'Plumbing Work', lastMessage: 'Can you bring extra PVC pipes?', time: '45 min ago', unread: 2, status: 'active', avatar: 'A' },
    { id: 'c3', customer: 'Sanjay Gupta', service: 'Electrical Wiring', lastMessage: 'What time tomorrow?', time: '1 hr ago', unread: 1, status: 'active', avatar: 'S' },
  ],
  driver_services: [
    { id: 'c1', customer: 'Kavita Joshi', service: 'Airport Transfer', lastMessage: 'Flight is at 6 AM, please arrive by 4:30.', time: '10 min ago', unread: 1, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'Mr. Malhotra', service: 'Corporate Chauffeur', lastMessage: 'Need pickup from office at 6 PM.', time: '30 min ago', unread: 0, status: 'active', avatar: 'M' },
  ],
  luxury_hire: [
    { id: 'c1', customer: 'Wedding Planner', service: 'Rolls Royce Hire', lastMessage: 'Please decorate with white flowers.', time: '1 hr ago', unread: 2, status: 'active', avatar: 'W' },
    { id: 'c2', customer: 'Magazine Editor', service: 'Vintage Car Shoot', lastMessage: 'Can we do golden hour shots?', time: '2 hrs ago', unread: 0, status: 'active', avatar: 'M' },
  ],
  commercial_vehicles: [
    { id: 'c1', customer: 'ABC Traders', service: 'Goods Transport', lastMessage: 'Load will be ready by 5 AM.', time: '30 min ago', unread: 1, status: 'active', avatar: 'A' },
    { id: 'c2', customer: 'Export Company', service: 'Container Loading', lastMessage: 'How many containers can you handle?', time: '2 hrs ago', unread: 0, status: 'active', avatar: 'E' },
  ],
  photography_video: [
    { id: 'c1', customer: 'Sharma Wedding', service: 'Wedding Photography', lastMessage: 'Can we do a couple shoot at sunset?', time: '10 min ago', unread: 2, status: 'active', avatar: 'S' },
    { id: 'c2', customer: 'FashionBrand', service: 'Product Photoshoot', lastMessage: 'We need edited photos by Monday.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'F' },
    { id: 'c3', customer: 'Verma Family', service: 'Birthday Photography', lastMessage: 'The candid shots were beautiful!', time: '3 hrs ago', unread: 0, status: 'completed', avatar: 'V' },
  ],
  drone_services: [
    { id: 'c1', customer: 'Kapoor Family', service: 'Wedding Aerial Shoot', lastMessage: 'Can you capture the Baraat from above?', time: '5 min ago', unread: 3, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'DLF Builders', service: 'Real Estate Drone', lastMessage: 'Include all 4 towers in the flyby.', time: '30 min ago', unread: 1, status: 'active', avatar: 'D' },
    { id: 'c3', customer: 'TechCorp Events', service: 'Event Aerial', lastMessage: 'The 4K footage was amazing!', time: '2 hrs ago', unread: 0, status: 'completed', avatar: 'T' },
  ],
  vehicle_services: [
    { id: 'c1', customer: 'BMW Owner', service: 'Car Detailing', lastMessage: 'Please use ceramic coating.', time: '20 min ago', unread: 1, status: 'active', avatar: 'B' },
    { id: 'c2', customer: 'Harley Owner', service: 'Bike Wash', lastMessage: 'Great job on the chrome polish!', time: '1 hr ago', unread: 0, status: 'completed', avatar: 'H' },
  ],
  tech_services: [
    { id: 'c1', customer: 'Amit Choudhary', service: 'Laptop Repair', lastMessage: 'The SSD upgrade worked perfectly!', time: '25 min ago', unread: 0, status: 'completed', avatar: 'A' },
    { id: 'c2', customer: 'Home Security', service: 'CCTV Installation', lastMessage: 'How many cameras for a 3BHK?', time: '1 hr ago', unread: 2, status: 'active', avatar: 'H' },
  ],
  garden_outdoor: [
    { id: 'c1', customer: 'Sharma Villa', service: 'Garden Maintenance', lastMessage: 'Can you come weekly?', time: '30 min ago', unread: 1, status: 'active', avatar: 'S' },
    { id: 'c2', customer: 'Gupta Residence', service: 'Pest Control', lastMessage: 'No more ants! Thank you!', time: '2 hrs ago', unread: 0, status: 'completed', avatar: 'G' },
  ],
  wellness_beauty: [
    { id: 'c1', customer: 'Priya (Bride)', service: 'Bridal Makeup', lastMessage: 'Can we do a trial this weekend?', time: '15 min ago', unread: 2, status: 'active', avatar: 'P' },
    { id: 'c2', customer: 'Meera Kapoor', service: 'Hair & Facial', lastMessage: 'Please bring organic products.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'M' },
  ],
  pet_services: [
    { id: 'c1', customer: 'Bruno Owner', service: 'Dog Grooming', lastMessage: 'Can you do a summer cut?', time: '10 min ago', unread: 2, status: 'active', avatar: 'B' },
    { id: 'c2', customer: 'Milo Owner', service: 'Pet Sitting', lastMessage: 'He likes to nap in the sunlight.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'M' },
  ],
  education: [
    { id: 'c1', customer: 'Parent - Khanna', service: 'Math Tutoring', lastMessage: 'His grades have improved!', time: '1 hr ago', unread: 0, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'Young Coder', service: 'Coding Class', lastMessage: 'Can we learn Python next?', time: '2 hrs ago', unread: 1, status: 'active', avatar: 'Y' },
  ],
  events_entertainment: [
    { id: 'c1', customer: 'Birthday Host', service: 'DJ Services', lastMessage: 'Please play 90s Bollywood hits!', time: '30 min ago', unread: 2, status: 'active', avatar: 'B' },
    { id: 'c2', customer: 'Baby Shower', service: 'Event Decoration', lastMessage: 'Theme is pink and gold.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'B' },
  ],
  culinary: [
    { id: 'c1', customer: 'Party Host', service: 'Party Cooking', lastMessage: 'Menu confirmed for 50 guests.', time: '20 min ago', unread: 2, status: 'active', avatar: 'P' },
    { id: 'c2', customer: 'Office Manager', service: 'Tiffin Service', lastMessage: 'Can you add Jain options?', time: '45 min ago', unread: 1, status: 'active', avatar: 'O' },
    { id: 'c3', customer: 'BBQ Party', service: 'BBQ Night', lastMessage: 'Will you bring the grill?', time: '1 hr ago', unread: 0, status: 'active', avatar: 'B' },
  ],
  shifting: [
    { id: 'c1', customer: 'Kumar Family', service: 'Home Shifting', lastMessage: 'Please send packing material today.', time: '15 min ago', unread: 2, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'Startup Co.', service: 'Office Shifting', lastMessage: '30 workstations to move.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'S' },
  ],
  special_services: [
    { id: 'c1', customer: 'Sharma Family', service: 'Puja Ceremony', lastMessage: 'Please bring all samagri.', time: '2 hrs ago', unread: 1, status: 'active', avatar: 'S' },
    { id: 'c2', customer: 'New Home Owner', service: 'Vastu Consultation', lastMessage: 'Which direction for main door?', time: '3 hrs ago', unread: 0, status: 'active', avatar: 'N' },
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the primary category for a user based on their skills
 */
export const getUserCategory = (skills: string[]): string => {
  if (!skills || skills.length === 0) return 'home_services'; // default
  
  // Count categories
  const categoryCounts: { [key: string]: number } = {};
  skills.forEach(skill => {
    const category = SKILL_TO_CATEGORY[skill];
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });
  
  // Return category with most skills
  let maxCategory = 'home_services';
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = cat;
    }
  });
  
  return maxCategory;
};

/**
 * Get appointments for a user based on their skills
 */
export const getAppointmentsForUser = (skills: string[]): any[] => {
  const category = getUserCategory(skills);
  return MOCK_APPOINTMENTS[category] || MOCK_APPOINTMENTS['home_services'];
};

/**
 * Get chats for a user based on their skills
 */
export const getChatsForUser = (skills: string[]): any[] => {
  const category = getUserCategory(skills);
  return MOCK_CHATS[category] || MOCK_CHATS['home_services'];
};
