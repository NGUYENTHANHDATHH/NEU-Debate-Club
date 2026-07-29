-- Auto updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated_at          BEFORE UPDATE ON tasks          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_announcements_updated_at  BEFORE UPDATE ON announcements  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_events_updated_at         BEFORE UPDATE ON events         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_transactions_updated_at   BEFORE UPDATE ON transactions   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_partners_updated_at       BEFORE UPDATE ON partners       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_media_links_updated_at    BEFORE UPDATE ON media_links    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto completed_at khi task done
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN NEW.completed_at = now(); END IF;
  IF NEW.status != 'done' THEN NEW.completed_at = NULL; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_task_completed_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- Auto update partner stats khi thêm collaboration
CREATE OR REPLACE FUNCTION update_partner_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE partners SET
      total_collaborations = total_collaborations + 1,
      total_sponsored      = total_sponsored + NEW.sponsored_amount,
      status = CASE WHEN total_collaborations + 1 >= 3
                    THEN 'than_thiet'::partner_status_enum
                    ELSE 'da_hop_tac'::partner_status_enum END
    WHERE id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_partner_stats AFTER INSERT ON collaborations FOR EACH ROW EXECUTE FUNCTION update_partner_stats();

-- Chỉ 1 season active
CREATE OR REPLACE FUNCTION ensure_one_active_season()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE seasons SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_one_active_season
  BEFORE INSERT OR UPDATE ON seasons
  FOR EACH ROW WHEN (NEW.is_active = true)
  EXECUTE FUNCTION ensure_one_active_season();