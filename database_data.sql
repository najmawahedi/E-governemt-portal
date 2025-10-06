--
-- PostgreSQL database dump
--

-- Dumped from database version 17rc1
-- Dumped by pg_dump version 17rc1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, description) FROM stdin;
1	Interior	Handles national documents
3	Land & Housing	Land ownership and building permits
4	Transport	Driver licenses and vehicle registration
5	Welfare	Social assistance and public welfare programs
2	Commerce 	Business and trade-related services
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, department_id, name, description, fee, required_fields) FROM stdin;
3	1	Birth Certificate Issuance	Request a copy of your birth certificate	10.00	\N
4	1	Marriage Certificate Issuance	Obtain an official marriage certificate	15.00	\N
5	1	Death Certificate Issuance	Request an official death certificate for record purposes	15.00	\N
1	1	Passport Renewal	Renew your passport for travel purposes	50.00	["full_name", "dob", "passport_number"]
2	1	National ID Update	Update your personal information on your national ID	20.00	["full_name", "dob", "national_id"]
7	1	Name Change Request	Request a legal change of name on official documents	25.00	["full_name", "old_name", "new_name"]
6	1	Residency Permit Renewal	Renew your official residency permit	40.00	["full_name", "residency_address", "residency_id"]
8	2	Business License Application	Apply for a business license	50.00	["full_name", "business_name", "registration_number"]
9	2	Trade Permit Registration	Register your trade permit	30.00	["full_name", "trade_type", "registration_number"]
10	3	Land Ownership Registration	Register land ownership	100.00	["full_name", "land_address", "document_number"]
11	3	Building Permit Application	Apply for building permits	75.00	["full_name", "building_address", "permit_number"]
12	4	Driver License Renewal	Renew your driver license	25.00	["full_name", "dob", "license_number"]
13	4	Vehicle Registration	Register your vehicle	40.00	["full_name", "vehicle_type", "registration_number"]
14	5	Social Assistance Application	Apply for social assistance	0.00	["full_name", "social_program", "income_info"]
15	4	IDK	IDK IDK	10.00	["full_name", "national_id", "dob", "dod"]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, national_id, dob, email, password, role, department_id, created_at, updated_at, phone_number, address, job_title) FROM stdin;
28	head	\N	\N	head@example.com	$2b$10$/rxeCU5hhgMbAiwFRi0Qv.giD5X9lT7hSPIQsruTcoQvhxEIVtll6	department_head	1	2025-10-04 15:06:45.22474	2025-10-04 15:06:45.22474	\N	\N	Department Head
29	headd	\N	\N	head1@example.com	$2b$10$S0ueFmAYy04hq5hTijafMuFdEkzsuUkUloYgkKtS4hH1q.EBPYiq2	department_head	1	2025-10-04 15:08:11.731059	2025-10-04 15:08:11.731059	\N	\N	Department Head
1	Najma	123456789	2001-01-01	najma@example.com	$2b$10$uUoj24S9mMTjKupBW8kZiOFEk3rh73YhMf2RNOaY6XWR43l/nfoTi	citizen	\N	2025-09-06 15:19:18.66213	2025-09-06 15:19:18.66213	0777123456	Kabuly, Afghanistan	\N
2	NAJMA WAHEDI	\N	\N	najmawahedi4@gmail.com	$2b$10$hnITliIbh0OpsZCQXZKgF.z0UeDrwmTetPTCLlydqCXxQyyCWHjWq	citizen	\N	2025-09-13 10:47:23.760309	2025-09-13 10:47:23.760309	\N	\N	\N
3	halal	0183928	2006-02-23	halal@gmail.com	$2b$10$IoXQTz4lnszkMg.iIMF6geAaywSUjs/Zro8dpTpuNUSfsqFq36AZe	citizen	\N	2025-09-13 11:13:30.28754	2025-09-13 11:13:30.28754	0787478799	6 Karte-se	INTERN
4	halala	0133928	2006-02-23	halala@gmail.com	$2b$10$M4.mcYTtxYjQ.GCZFGMJ6.CMTW5E3e8dIKNlBQQA/PSjYHrGk08cm	citizen	\N	2025-09-13 11:29:16.956721	2025-09-13 11:29:16.956721	07834478799	6 Karte-se	\N
8	,jeafh	\N	\N	387erkgsdjfglid@galkdjr.com	$2b$10$qISys/3HPsUC.9uG6ggCiOfO53ap556l//UodGz.0J/SPy/DXSgsq	citizen	\N	2025-09-13 15:09:00.24244	2025-09-13 15:09:00.24244	\N	\N	\N
9	Najma Wahedi	\N	\N	Najywakjkieurhedi@gmail.com	$2b$10$juXzd0QsiDpzrRwR8OZ5XO/lUaOPS.Pl/gsl4AwNSEZgQMBzHJYDK	citizen	\N	2025-09-13 15:17:51.901965	2025-09-13 15:17:51.901965	07874787995	6 Karte-se	\N
11	.jarfd;oiwe	o83458935	\N	NajywahdsfwseafWEFedi@gmail.com	$2b$10$8cB6mquWxCRwCv173/oXbukzGq2HOPs4OIv8IDu4Twu0plZ9FTTCa	citizen	\N	2025-09-13 15:49:52.279731	2025-09-13 15:49:52.279731	0787478799	6 Karte-se	\N
12	lkfoael	343478	3333-02-02	Najywalisdfoaweifaefhedi@gmail.com	$2b$10$QUkwG7mhRCa7CxWMDwMjoubYZCkVCt5tOF.xGT.TemRGKDa9yIyFq	citizen	\N	2025-09-13 15:50:41.055533	2025-09-13 15:50:41.055533	0787478799	6 Karte-se	ladkjusfailuj
13	Najma Wahedij	2342	4443-03-22	Najywahejhikuidi@gmail.com	$2b$10$jmXUDrFWfAGEPzpDHsa1uuN0V4W1Hw8nV.w3cTshTcsCCPDTVtUBa	citizen	\N	2025-09-13 16:17:59.177876	2025-09-13 16:17:59.177876	0787478799	6 Karte-se	\N
14	najma wahedia	2374683749	22222-01-01	alijfoiaj@lsdkjg.com	$2b$10$IcE6XkxR6oWd9Zvvx1XQ8Of8ZK8S3ixp3yzeZ9YSuZTpAr5vQfbga	citizen	\N	2025-09-15 09:24:55.101405	2025-09-15 09:24:55.101405	w78348q743	dirhflaiuzhfliwe	kjshgiserhieh
15	Najma Wahedi	ujhi	8888-09-08	Najywahijjhjujhedi@gmail.com	$2b$10$7d/HiGUST6SL5IRQ4kELdu2FzMqi2hoq/qRlPK2qEcKLCkhHtNgiG	citizen	\N	2025-09-15 10:05:59.486432	2025-09-15 10:05:59.486432	67789	,hiututy	ljuub
16	kjfkjasdf	\N	\N	Najywdfafawsefsasdsahedi@gmail.com	$2b$10$VIEhPUdHWhkAwSEDZNALyOsLy7Blm7xHa2OexEk6ZvIx6ejv/fS6.	citizen	\N	2025-09-15 10:21:04.832214	2025-09-15 10:21:04.832214	0787478799	6 Karte-se	\N
17	Najma Wahedi	\N	\N	Najywsdfasdfaahedi@gmail.com	$2b$10$6enREbSTsxncEfJQK05lgenN6S6OQohzlignVcVWVgl3aIR0B57tK	citizen	\N	2025-09-15 10:40:59.714294	2025-09-15 10:40:59.714294	0787478799	6 Karte-se	\N
18	nazy	\N	\N	Najywahedii@gmail.com	$2b$10$1ye99nSxGYCjR9o5ltCWkePecpboWmxiLx7kOQvqKlEC.QEeF8oCW	citizen	\N	2025-09-15 15:25:18.650192	2025-09-15 15:25:18.650192	0787478799	6 Karte-se	\N
19	iukhfriauw	\N	\N	Najywaskuefhilauwkhfiaukwhedi@gmail.com	$2b$10$tY81FsA8wzdyyhsAC0ZwpeGOuqt.tTMtbeIqIXig9Xuz5abauLSO6	citizen	\N	2025-09-27 17:10:15.779834	2025-09-27 17:10:15.779834	0787478799	6 Karte-se	\N
20	Officer Ali	OFC123456	1985-07-15	officer@example.com	$2b$10$0XKb0jTyoWxVQxI2bYhaN.JnQh6GgzCpCvnxZXjWBC9Vj.7I3dmuO	officer	1	2025-10-02 11:44:57.195713	2025-10-02 11:44:57.195713	0700000000	Kabul, Afghanistan	Senior Officer
21	Admin User	\N	\N	admin@example.com	$2b$10$hVYDiI0bI6qGXsUYbbEzzeXTxUsUkksWAU/cCdQNFgOL3anzUCXua	admin	\N	2025-10-02 14:42:23.716827	2025-10-02 14:42:23.716827	\N	\N	\N
23	najmaofficer	\N	\N	najmanajma@gmail.com	$2b$10$HUGxT2FpQDT8faZFI8LGnu10MAcBXknfrPJhHV6vT.UaQn6PHqC/i	officer	2	2025-10-03 13:20:50.7598	2025-10-03 13:20:50.7598	\N	\N	trainee
24	nazyhead	\N	\N	email@gmail.com	$2b$10$kGraCdG3KHHkrIxzAi9sT./53Bc5nTYwUmDZysf9ikPC5QLI2yDiO	department_head	5	2025-10-03 13:25:01.089826	2025-10-03 13:25:01.089826	\N	\N	Department Head
10	asad ahmad	\N	\N	Najywadsfafhedi@gmail.com	$2b$10$XTzItFEN.Xz0foq1kaWz7eN0ZsxzM2s.aLODJzSJM4A6OLis6BJ1C	citizen	\N	2025-09-13 15:49:26.641637	2025-09-13 15:49:26.641637	0787478799	6 Karte-se	\N
25	nazy	\N	\N	nazy@example.com	$2b$10$p25HLCkacWkDSf2Tnq6K1eHpg1VyGq.OK2icHLZN79GfKVlNfScjG	officer	2	2025-10-04 09:38:23.019211	2025-10-04 09:38:23.019211	\N	\N	officer
26	naazy	\N	\N	naazy@example.com	$2b$10$d8GAewHHv5q.C9UAGfaoee8GeK7UYCVRrjwdB4h0aaR1kj3Wig32q	officer	1	2025-10-04 10:00:40.166897	2025-10-04 10:00:40.166897	\N	\N	passport officer
27	najy	\N	\N	najy@example.com	$2b$10$h4vsRsgvrhDOedaiTyzuze1HlEx8B/m0rXNY5ucd1p2xxz.iT7m/G	department_head	1	2025-10-04 10:01:49.841736	2025-10-04 10:01:49.841736	\N	\N	Department Head
\.


--
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requests (id, citizen_id, service_id, status, created_at, updated_at, request_data, assigned_officer_id) FROM stdin;
23	1	15	under_review	2025-10-04 14:31:54.14096	2025-10-04 14:42:35.174845	{"full_name":"kuhiu","national_id":"123456789","dob":"14/03/20","dod":"22/22/22"}	\N
25	1	3	submitted	2025-10-04 14:53:21.991577	2025-10-04 14:53:21.991577	{}	\N
19	1	1	approved	2025-10-02 10:36:08.172396	2025-10-04 11:08:19.682667	{"full_name":"alison burger","dob":"14/03/2001","passport_number":"p00036955"}	20
21	1	6	rejected	2025-10-03 09:40:58.601357	2025-10-04 11:08:44.02736	{"full_name":"kuhiu","residency_address":"yug877yhhi5678","residency_id":"45678"}	20
24	1	2	under_review	2025-10-04 14:45:19.830274	2025-10-04 14:49:52.668491	{"full_name":"nor haya","dob":"14/03/2001","national_id":"894538ie"}	20
22	1	6	under_review	2025-10-04 11:39:35.619487	2025-10-04 14:50:08.250865	{"full_name":"jkahfkj","residency_address":"kjfhkja","residency_id":"kjhfkjf"}	20
26	1	3	under_review	2025-10-04 14:54:00.683777	2025-10-04 14:54:06.628649	{}	20
20	1	6	approved	2025-10-02 16:50:39.57683	2025-10-04 15:41:54.097265	{"full_name":"ekrnja","residency_address":"kejejrf","residency_id":"298483"}	20
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, request_id, file_path, file_type, original_file_name) FROM stdin;
1	19	uploads\\1759385167962.jpg	jpg	ppasport.jpg
2	20	uploads\\1759407629057.jpg	jpg	img20250329_16090675.jpg
3	21	uploads\\1759468251395.jpg	jpg	img20250329_16111804.jpg
4	22	1759561769762.jpg	jpg	img20250329_16090675.jpg
5	23	1759572111341.jpg	jpg	img20250329_16111804.jpg
6	24	1759572919731.jpeg	jpeg	2 ADHD.jpeg
7	25	1759573401281.jpeg	jpeg	3 adhd.jpeg
8	26	1759573439957.jpeg	jpeg	3 adhd.jpeg
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, is_read, created_at) FROM stdin;
1	1	Your passport renewal request has been approved!	f	2025-10-03 10:03:24.007928
2	1	Payment received for business license application	f	2025-10-03 10:03:24.007928
3	1	Your national ID update is under review	t	2025-10-03 10:03:24.007928
4	1	Document verification required for land registration	f	2025-10-03 10:03:24.007928
5	1	Your request #19 is now under_review.	f	2025-10-04 11:08:05.420305
6	1	Your request #19 is now approved.	f	2025-10-04 11:08:19.689894
7	1	Your request #21 is now rejected.	f	2025-10-04 11:08:44.045706
8	1	Your Residency Permit Renewal request is is under review 🔍.	f	2025-10-04 11:23:51.001728
9	1	Your Residency Permit Renewal request is approved ✅.	f	2025-10-04 15:37:15.777452
10	1	Your Residency Permit Renewal request is approved ✅.	f	2025-10-04 15:41:54.113725
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, request_id, amount, status, payment_date) FROM stdin;
8	23	10.00	success	2025-10-04 14:42:34.715167
9	24	20.00	success	2025-10-04 14:49:52.604943
10	22	40.00	success	2025-10-04 14:50:08.247541
11	26	10.00	success	2025-10-04 14:54:06.280037
\.


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 7, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 8, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 10, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 11, true);


--
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.requests_id_seq', 26, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 15, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 29, true);


--
-- PostgreSQL database dump complete
--

