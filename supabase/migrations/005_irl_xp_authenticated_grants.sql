grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

grant select on public.characters to authenticated;

grant select, insert, update, delete
on public.quests
to authenticated;

grant select on public.quest_completions to authenticated;

grant select on public.shop_items to authenticated;

grant select on public.user_inventory to authenticated;