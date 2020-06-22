/**
 * Include your custom JavaScript here.
 *
 * We also offer some hooks so you can plug your own logic. For instance, if you want to be notified when the variant
 * changes on product page, you can attach a listener to the document:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   var variant = event.detail.variant; // Gives you access to the whole variant details
 * });
 *
 * You can also add a listener whenever a product is added to the cart:
 *
 * document.addEventListener('product:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 *   var quantity = event.detail.quantity; // Get the quantity that was added
 * });
 *
 * If you just want to force refresh the mini-cart without adding a specific product, you can trigger the event
 * "cart:refresh" in a similar way (in that case, passing the quantity is not necessary):
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 */

var Theme = {
  moneyFormat: "${{amount}} USD"
}

if (typeof Currency === 'undefined') {
  var Currency = {};
}

Currency.formatMoney = function (cents, format) {
  if (typeof Shopify.formatMoney === 'function') {
    return Shopify.formatMoney(cents, format);
  }
  if (typeof cents == 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || '${{amount}}';

  function defaultOption(opt, def) {
    return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal = defaultOption(decimal, '.');
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100.0).toFixed(precision);
    var parts = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents = parts[1] ? (decimal + parts[1]) : '';
    return dollars + cents;
  }
  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }
  return formatString.replace(placeholderRegex, value);
};

var ProductUtils = (function () {
  function ProductUtils(el) {
    _classCallCheck(this, ProductUtils);

    this.$window = $(window);
    this.$body = $(document.body);
    this.$el = $(el);
    this.addInProgress = false;

    this.productHandle = this.$el.data('product');
    this.product = this.$el.data('product-json');
    this.currentVariant = this.$el.data('product-current-variant');
    this.hasDeepLinking = this.$el.data('product-deeplinking') ? true : false;

    // Product elements
    this.$images = this.$el.find('[data-product-images]');
    this.$thumbnails = this.$el.find('[data-product-thumbnails]'), this.$lightbox = this.$el.find('[data-product-images-lightbox-wrapper]');
    this.$options = this.$el.find('[data-product-options]');
    this.$price = this.$el.find('[data-product-price]');
    this.$priceCompare = this.$el.find('[data-product-price-compare]');
    this.$stockWrapper = this.$options.find('[data-product-stock-wrapper]');
    this.$addToCart = this.$options.find('[data-product-add]');
    this.$message = this.$el.find('[data-product-message]');

    this._bindEvents();
  };

  ProductUtils.prototype._bindEvents = function _bindEvents() {
    var _this2 = this;

    $(document).on('change', '[data-product-swatch-input]', function (event) {
      _this2._getCurrentVariant();
    });
  };

  ProductUtils.prototype._getCurrentVariant = function _getCurrentVariant() {
    var options = this.product.options,
      variants = this.product.variants,
      selectedOptions = [];

    for (var i in options) {
      selectedOptions.push(this.$options.find('[data-product-swatch="' + i + '"] input:checked').val());
    }

    for (var i in variants) {
      if (selectedOptions[0] === variants[i].option1) {
        if (options.length > 1) {
          if (selectedOptions[1] === variants[i].option2) {
            if (options.length === 3) {
              if (selectedOptions[2] === variants[i].option3) {
                this.currentVariant = variants[i];
              }
            } else {
              this.currentVariant = variants[i];
            }
          }
        } else {
          this.currentVariant = variants[i];
        }
      }
    }

    this._selectCallback(this.currentVariant);
  };

  ProductUtils.prototype._selectCallback = function _selectCallback(variant) {
    if (variant) {
      var priceFormatted = Currency.formatMoney(variant.price, Theme.moneyFormat);
      var compareAtPriceFormatted = Currency.formatMoney(variant.compare_at_price, Theme.moneyFormat);

      this.$options.find('#product-select-simple').val(variant.id);
      this.$price.html(priceFormatted);

      if (variant.compare_at_price > variant.price) {
        this.$priceCompare.removeClass('hidden').html(compareAtPriceFormatted);
      } else {
        this.$priceCompare.addClass('hidden');
      }

      // this._closeMessage();

      // if (this.$stockWrapper.length) {
      //   this._updateStock();
      // }

      if (variant.featured_image) {
        // this._switchImage(variant.featured_image.src);
      }

      if (this.hasDeepLinking) {
        this._updateVariantDeepLink(variant);
      }

      if (variant.available) {
        this._updateButtonText(Theme.localization.product.addToCart, true);
      } else {
        this._updateButtonText(Theme.localization.product.soldOut, false);
      }
    } else {
      this._updateButtonText(Theme.localization.product.unavailable, false);
    }
  };

  ProductUtils.prototype._updateButtonText = function _updateButtonText(text, isEnabled, $button) {
    this.$addToCart.prop('disabled', !isEnabled).toggleClass('button-disabled', !isEnabled).children('.button-text').text(text);
  };

  ProductUtils.prototype._updateVariantDeepLink = function _updateVariantDeepLink(variant) {
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, "?variant=" + variant.id);
    }
  };

  return ProductUtils;
})();

// new ProductUtils('[data-product]');


jQuery(document).ready(function ($) {
   //----- OPEN
  $('[data-popup-open]').on('click', function (e) {
    var targeted_popup_class = $(this).attr('data-popup-open');
    $('[data-popup="' + targeted_popup_class + '"]').css('display', 'flex');
  });
  //----- CLOSE
  $('[data-popup-close]').on('click', function (e) {
    var targeted_popup_class = $(this).attr('data-popup-close');
    $('[data-popup="' + targeted_popup_class + '"]').css('display', 'none');
  });

  $("[data-popup]").click(function (e) {
    $target = $(e.target);
    if (!$target.closest('.popup-inner').length && $('.popup-inner').is(":visible")) {
      $('[data-popup-close]').trigger("click");
    }
  });

  $(".trigger_popup_fricc").click(function () {
    $('.hover_bkgr_fricc').show();
  });
  $('.hover_bkgr_fricc').click(function () {
    $('.hover_bkgr_fricc').hide();
  });
  $('.popupCloseButton').click(function () {
    $('.hover_bkgr_fricc').hide();
  });

});
