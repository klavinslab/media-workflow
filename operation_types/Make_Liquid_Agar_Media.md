# Make Liquid/Agar Media

Documentation here. Start with a paragraph, not a heading or title, as in most views, the title will be supplied by the view.




### Outputs


- **Media** [A]  
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "1000 mL Agar")'>1000 mL Agar</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "1000 mL Liquid")'>1000 mL Liquid</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "500 mL Agar")'>500 mL Agar</a>
  - <a href='#' onclick='easy_select("Sample Types", "Media")'>Media</a> / <a href='#' onclick='easy_select("Containers", "500 mL Liquid")'>500 mL Liquid</a>

### Precondition <a href='#' id='precondition'>[hide]</a>
```ruby
def precondition(op)
  true
end
```

### Protocol Code <a href='#' id='protocol'>[hide]</a>
```ruby
# frozen_string_literal: true

class Measure
  include Comparable

  attr_reader :amount, :unit

  def initialize(amount:, unit:)
    @amount = amount
    @unit = unit
  end

  def <=>(other)
    if @unit == other.unit
      if @amount < other.amount
        -1
      elsif @amount > other.amount
        1
      else
        0
      end
    else 
      @unit <=> other.unit
    end
  end

  def to_s
    "#{amount} #{unit}"
  end
end

class Ingredient
  attr_reader :name, :amount, :directions, :unit

  def initialize(name:, amount:, unit:, directions:)
    @name = name
    @amount = amount
    @unit = unit
    @directions = directions
  end
  
  def to_s
    @name
  end
end

class Media
  attr_reader :sample_name, :bottle, :volume, :unit, :type, :output
  attr_accessor :count

  def initialize(sample_name:, bottle:, volume:, unit:, type:, count:, output:)
    @sample_name = sample_name
    @bottle = bottle
    @volume = volume
    @unit = unit
    @type = type
    @count = count
    @output = output
  end
  
  def to_s
    @sample_name
  end
end

class Recipe
  attr_reader :ingredients

  def initialize
    @ingredients = []
  end

  def add(ingredient:)
    @ingredients.push(ingredient)
  end
end


class Protocol

  def make_media_steps(media_type:, media_vol:, bottle:, num_bottles:, multiplier:, ingredients:)
    
    show do
      title 'Gather the Following Items'
      check "#{num_bottles} bucket(s)"
      check "#{num_bottles} funnel(s)"
      if media_type == :agar
         flask_vol = media_vol * 2
         check "#{num_bottles} #{flask_vol} mL Erlenmeyer flask(s)"
      elsif media_type == :liquid
         num_bottles = media_vol / 500
         check "#{num_bottles} 500 mL bottle(s)"
      end
      ingredients.each do |reagent|
        check reagent.name
      end
    end
    
    show do
      title 'Measure Water'
      note "Use the DI water carboy or DI faucet at sink to add water up to the #{multiplier * 1000} mL mark in the bucket"
      note 'Place bucket filled with water on magnetic hotplater stirrer'
    end
    
    # if bottle.include?('1 L Bottle')
    show do
      title 'Add Stir Bar'
      check 'Retrieve 1 Medium Magnetic Stir Bar(s) from right hand drawer of weighing station or dishwashing station.'
      check 'Add the stir bar(s) to the bucket(s).'
      check 'Turn Stir dial to half way'
    end
    # end

    ingredients.each do |reagent|
      show do
        title "Add #{reagent}"
        if reagent.name.include? "100x Dropout Solution"
            note "Shake bottle very well"
            note "Using a 10mL or bigger pipet will clog, so transfer <b>#{reagent.amount * multiplier}</b> #{reagent.unit} of <b>#{reagent.name}</b> to a sterile Falcon/Conical tube"
            note "Continually keep shaking tube before you add it to the desired media"
            note "add <b>#{reagent.amount * multiplier}</b> #{reagent.unit} of <b>'#{reagent.name}'</b> into each bucket."
        else    
            note "Using the #{reagent.directions}, add <b>#{reagent.amount * multiplier}</b> #{reagent.unit} of <b>#{reagent.name}'</b> into each bucket."
        end
      end
    end
  end

  def label_media_steps(media_type, multiplier, label, number, mix_note = 'Allow ingredients to mix for a few minutes. It is ok if a small amount of powder is not dissolved because the autoclave will dissolve it', water_note = 'DI water carboy or DI faucet at sink', label_note = '')

    show do
      title 'Mix Solution'
      note mix_note.to_s
    end

    show do
        title 'Transfer Solution'
        if media_type == :liquid
            check 'Place funnel into bottle'
            check 'Pour solution up to 500 mL mark in bottle(s)'
            check 'Put cap back on bottle(s) loosely'
        elsif media_type == :agar
            check 'Place funnel into Erlenmeyer flask(s)'
            check 'Pour 1000 mL of solution into Erlenmeyer flask(s)'
            check 'Loosely cover top of Erlenmeyer flask(s) with aluminum'
        end
    end

    if media_type == :liquid
        show do
          title 'Label Media'
          note "Label the bottle(s) with '#{label}', 'Your initials', 'date', and '#{number}'"
          note label_note.to_s
        end
    end
  end

  def group_media(operations:)
    media_to_make = Hash.new
    operations.each do |op|
      item = op.output('Media').item
      sample_name = item.sample.name
      container = item.object_type.name

      key = "#{container} #{sample_name}"
      if media_to_make[key].nil?
        m = container.match(/(\d+)\s(\w+)\s(\w+)/)
        raise ProtocolError.new(message: 'Expect object type to indicate volume and Agar/Liquid') if m.nil?

        vol_str, unit, state = m.captures
        vol = vol_str.to_i
        # bottle_volume = vol + vol / 4
        bottle_volume = vol
        # update for bucket
        bottle = "#{bottle_volume == 1000.0 ? '1 L' : "#{bottle_volume} mL"} Bottle"
        media_to_make[key] = Media.new(sample_name: sample_name, volume: vol, unit: unit, type: state.downcase.to_sym, bottle: bottle, count: 0, output: [])
      end
      media_to_make[key].count += 1
      media_to_make[key].output.push(item.id)
    end
    media_to_make
  end

  def main
    operations.retrieve(interactive: false)
    operations.make

    dry_units = 'gram'
    dry_directions = 'gram scale, large weigh boat, and chemical spatula'
    wet_units = 'ml'
    wet_directions = 'serological pipette'
    
    sugars_hash = {"Dex" => "Dextrose", "Gal" => "Galactose", "Gly" => "Glycerol", "Suc" => "Sucrose"}

    media_to_make = group_media(operations: operations)
    media_to_make.each_value do |media|
        # change to 1000
      multiplier = media.volume / 1000.0
      
      ingredients = []
      label = create_label(media: media)
      mix_note = 'Allow ingredients to mix for a few minutes. It is ok if a small amount of powder is not dissolved because the autoclave will dissolve it'
      water_note = 'DI water carboy or DI faucet at sink'
      label_note = ''
        
      if media.sample_name.include?('LB')

        ingredients.push(Ingredient.new(name: 'LB broth powder', amount: 20.0, unit: dry_units, directions: dry_directions))

        # ingredients.push(Ingredient.new(name: 'Yeast Extract', amount: 5.0, unit: dry_units, directions: dry_directions))
        # ingredients.push(Ingredient.new(name: 'Bacto Tryptone', amount: 10.0, unit: dry_units, directions: dry_directions))
        # ingredients.push(Ingredient.new(name: 'NaCl (Sodium Chloride)', amount: 10.0, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Agar', amount: 20.0, unit: dry_units, directions: dry_directions)) if media.type == :agar

    # 10mg Tetracycline - dissolve in 5 mL dH2O 50% EtOH
    # -----------------------
      
        
      elsif media.sample_name.include?("YEP")
        ingredients.push(Ingredient.new(name: 'Yeast Extract', amount: 10.0, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Bacto Peptone', amount: 20.0, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Adenine', amount: 0.12, unit: dry_units, directions: dry_directions))
        ingredients.push(Ingredient.new(name: 'Uracil', amount: 0.06, unit: dry_units, directions: dry_directions))
        
        sugars_hash.each do |shorthand, sugar|
            if media.sample_name.include?(shorthand)
                ingredients.push(Ingredient.new(name: sugar, amount: 20.0, unit: dry_units, directions: dry_directions))
            end
        end
        
        ingredients.push(Ingredient.new(name: 'Agar', amount: 20.0, unit: dry_units, directions: dry_directions)) if media.type == :agar
    
    # adding G418: 200mg G418, 4 mL 1M Tris pH 8.0 - add when media cooled to 55C
# -----------------------
    # need to add drop media sample types ******
        elsif media.sample_name.include?("Synthetic")
            ade = !media.sample_name.include?('-Ade')
            his = !media.sample_name.include?('-His')
            arg = !media.sample_name.include?('-Arg')
            met = !media.sample_name.include?('-Met')
            ura = !media.sample_name.include?('-Ura')
            leu = !media.sample_name.include?('-Leu')
            trp = !media.sample_name.include?('-Trp')
            
            ingredients.push(Ingredient.new(name: 'Yeast nitrogen base without amino acids', amount: 6.70, unit: dry_units, directions: dry_directions))
            ingredients.push(Ingredient.new(name: '100x Dropout Solution', amount: 10, unit: wet_units, directions: wet_directions))

            ingredients.push(Ingredient.new(name: 'Adenine powder', amount: 0.12, unit: dry_units, directions: dry_directions)) if ade
            ingredients.push(Ingredient.new(name: 'Histidine powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if his
            ingredients.push(Ingredient.new(name: 'Arginine powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if arg
            ingredients.push(Ingredient.new(name: 'Methionine powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if met
            ingredients.push(Ingredient.new(name: 'Uracil powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if ura
            ingredients.push(Ingredient.new(name: 'Leucine powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if leu
            ingredients.push(Ingredient.new(name: 'Tryptophan powder', amount: 0.05, unit: dry_units, directions: dry_directions)) if trp
            
            sugars_hash.each do |shorthand, sugar|
                if media.sample_name.include?(shorthand)
                    ingredients.push(Ingredient.new(name: sugar, amount: 20.0, unit: dry_units, directions: dry_directions))
                end
            end
            
            ingredients.push(Ingredient.new(name: 'Agar', amount: 20.0, unit: dry_units, directions: dry_directions)) if media.type == :agar

        end

        make_media_steps(media_type: media.type, media_vol: media.volume, bottle: media.bottle, num_bottles: media.count, multiplier: multiplier, ingredients: ingredients) 
        label_media_steps(media.type, multiplier, label, media.output, mix_note, water_note, label_note)
    end
  end

  def create_label(media:)
    if media.sample_name.include?("Synthetic")
      label = 'Synthetic'
      label += ' +Gal' if media.sample_name.include?('Gal')
      label += ' +Dex' if media.sample_name.include?('Dex')
      label += ' +Gly' if media.sample_name.include?('Gly')
      label += ' +Suc' if media.sample_name.include?('Suc')
      label += ' -Ade' if media.sample_name.include?('-Ade')
      label += ' -His' if media.sample_name.include?('-His')
      label += ' -Arg' if media.sample_name.include?('-Arg')
      label += ' -Met' if media.sample_name.include?('-Met')
      label += ' -Ura' if media.sample_name.include?('-Ura')
      label += ' -Leu' if media.sample_name.include?('-Leu')
      label += ' -Trp' if media.sample_name.include?('-Trp')
        
    elsif media.sample_name.include?("YEP")
        label = 'YEP'
        label += ' +Gal' if media.sample_name.include?('Gal')
        label += ' +Dex' if media.sample_name.include?('Dex')
        label += ' +Gly' if media.sample_name.include?('Gly')
        label += ' +Suc' if media.sample_name.include?('Suc')
    
    elsif media.sample_name.include?('LB')
      "LB #{media.type.to_s.capitalize}"

    end
  end
end


```
