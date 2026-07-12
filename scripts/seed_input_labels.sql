alter table questions add column if not exists input_labels text[];

update questions set input_labels = array['length','breadth']::text[]
  where title = 'Rectangle Perimeter and Area';
update questions set input_labels = array['a and b (space-separated)']::text[]
  where title = 'Integer and Float Division of Two Numbers';
update questions set input_labels = array['total — bill in rupees','people']::text[]
  where title = 'Split a Bill Evenly';
update questions set input_labels = array['Celsius temperature']::text[]
  where title = 'Temperature Conversion Report';
