include $(TOPDIR)/rules.mk

PKG_NAME:=awrf
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/awrf
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Advanced WiFi Router Framework
  DEPENDS:=+iw +ip +ping +dnsmasq
endef

define Package/awrf/description
  Mobile-friendly Wi-Fi/WISP management framework for OpenWrt.
endef

define Build/Compile
endef

define Package/awrf/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/awrf $(1)/etc/config/awrf
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/etc/uci-defaults/99-awrf $(1)/etc/uci-defaults/99-awrf
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/awrf $(1)/etc/init.d/awrf
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/awrf-check $(1)/usr/bin/awrf-check
	$(INSTALL_BIN) ./files/usr/bin/awrf-runtime $(1)/usr/bin/awrf-runtime
	$(INSTALL_BIN) ./files/usr/bin/awrf-wifi-optimize $(1)/usr/bin/awrf-wifi-optimize
	$(INSTALL_DIR) $(1)/usr/lib/awrf
	$(CP) ../../dist/* $(1)/usr/lib/awrf/ 2>/dev/null || true
endef

$(eval $(call BuildPackage,awrf))
