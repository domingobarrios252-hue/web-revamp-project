
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'es';

UPDATE public.regions SET country_code = 'co' WHERE code = 'COL';
UPDATE public.regions SET country_code = 'ec' WHERE code = 'ECU';
UPDATE public.regions SET country_code = 've' WHERE code = 'VEN';

CREATE INDEX IF NOT EXISTS regions_country_code_idx ON public.regions (country_code);

INSERT INTO public.regions (name, code, scope, country_code, sort_order) VALUES
('Amazonas','CO-AMA','Departamento','co',1),
('Antioquia','CO-ANT','Departamento','co',2),
('Arauca','CO-ARA','Departamento','co',3),
('Atlántico','CO-ATL','Departamento','co',4),
('Bolívar','CO-BOL','Departamento','co',5),
('Boyacá','CO-BOY','Departamento','co',6),
('Caldas','CO-CAL','Departamento','co',7),
('Caquetá','CO-CAQ','Departamento','co',8),
('Casanare','CO-CAS','Departamento','co',9),
('Cauca','CO-CAU','Departamento','co',10),
('Cesar','CO-CES','Departamento','co',11),
('Chocó','CO-CHO','Departamento','co',12),
('Córdoba','CO-COR','Departamento','co',13),
('Cundinamarca','CO-CUN','Departamento','co',14),
('Bogotá D.C.','CO-DC','Distrito','co',15),
('Guainía','CO-GUA','Departamento','co',16),
('Guaviare','CO-GUV','Departamento','co',17),
('Huila','CO-HUI','Departamento','co',18),
('La Guajira','CO-LAG','Departamento','co',19),
('Magdalena','CO-MAG','Departamento','co',20),
('Meta','CO-MET','Departamento','co',21),
('Nariño','CO-NAR','Departamento','co',22),
('Norte de Santander','CO-NSA','Departamento','co',23),
('Putumayo','CO-PUT','Departamento','co',24),
('Quindío','CO-QUI','Departamento','co',25),
('Risaralda','CO-RIS','Departamento','co',26),
('San Andrés y Providencia','CO-SAP','Departamento','co',27),
('Santander','CO-SAN','Departamento','co',28),
('Sucre','CO-SUC','Departamento','co',29),
('Tolima','CO-TOL','Departamento','co',30),
('Valle del Cauca','CO-VAC','Departamento','co',31),
('Vaupés','CO-VAU','Departamento','co',32),
('Vichada','CO-VID','Departamento','co',33)
ON CONFLICT (code) DO NOTHING;
